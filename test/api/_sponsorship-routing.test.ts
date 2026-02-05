import { beforeEach, describe, expect, it, vi } from "vitest";
import { BigNumber, utils } from "ethers";

import { routeStrategyForSponsorship } from "../../api/_sponsorship-routing";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../api/_constants";
import { USDH_SPOT_ON_HYPERCORE } from "./_bridges/hypercore-intent/utils";

vi.mock("../../api/_bridges/cctp-sponsored/strategy", () => ({
  getSponsoredCctpBridgeStrategy: vi.fn((isEligible: boolean) => ({
    name: isEligible ? "cctp-sponsored" : "cctp-unsponsored",
  })),
  isRouteSupported: vi.fn(() => false),
}));

vi.mock("../../api/_bridges/oft-sponsored/strategy", () => ({
  getOftSponsoredBridgeStrategy: vi.fn(() => ({ name: "oft-sponsored" })),
  isRouteSupported: vi.fn(() => false),
}));

vi.mock("../../api/_bridges/hypercore-intent/strategy", () => ({
  getHyperCoreIntentBridgeStrategy: vi.fn(
    (params: { isEligibleForSponsorship: boolean }) => ({
      name: params.isEligibleForSponsorship ? "sponsored-intent" : "across",
    })
  ),
}));

vi.mock("../../api/_bridges/hypercore-intent/utils/common", () => ({
  isRouteSupported: vi.fn(() => true),
}));

vi.mock("../../api/_sponsorship-eligibility", () => ({
  getSponsorshipEligibilityPreChecks: vi.fn(() => ({
    isEligibleTokenPair: true,
    isWithinInputAmountLimit: true,
    isWithinGlobalDailyLimit: true,
    isWithinUserDailyLimit: true,
    isWithinAccountCreationDailyLimit: true,
    isCctpEnabledOriginChain: true,
    isOftEnabledOriginChain: true,
    isHyperCoreIntentSupported: true,
    isMintBurnThresholdMet: true,
  })),
}));

vi.mock("../../api/_utils", () => ({
  getLogger: vi.fn(() => ({ warn: vi.fn(), debug: vi.fn() })),
  ConvertDecimals: vi.fn(
    (_fromDecimals: number, _toDecimals: number) => (amount: BigNumber) =>
      amount
  ),
}));

const mockEligibility = async (
  overrides: Partial<{
    isEligibleTokenPair: boolean;
    isWithinInputAmountLimit: boolean;
    isWithinGlobalDailyLimit: boolean;
    isWithinUserDailyLimit: boolean;
    isWithinAccountCreationDailyLimit: boolean;
    isCctpEnabledOriginChain: boolean;
    isOftEnabledOriginChain: boolean;
    isHyperCoreIntentSupported: boolean;
    isMintBurnThresholdMet: boolean;
  }> = {}
) => {
  const { getSponsorshipEligibilityPreChecks } = await import(
    "../../api/_sponsorship-eligibility"
  );
  (
    getSponsorshipEligibilityPreChecks as ReturnType<typeof vi.fn>
  ).mockReturnValue({
    isEligibleTokenPair: true,
    isWithinInputAmountLimit: true,
    isWithinGlobalDailyLimit: true,
    isWithinUserDailyLimit: true,
    isWithinAccountCreationDailyLimit: true,
    isCctpEnabledOriginChain: true,
    isOftEnabledOriginChain: true,
    isHyperCoreIntentSupported: true,
    isMintBurnThresholdMet: true,
    ...overrides,
  });
};

describe("routeStrategyForSponsorship - USDT routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should route USDT to OFT strategy", async () => {
    await mockEligibility({
      isOftEnabledOriginChain: true,
      isMintBurnThresholdMet: true,
    });
    const { isRouteSupported } = await import(
      "../../api/_bridges/oft-sponsored/strategy"
    );
    (isRouteSupported as ReturnType<typeof vi.fn>).mockReturnValue(true);

    const params = {
      inputToken: {
        address: TOKEN_SYMBOLS_MAP.USDT.addresses[CHAIN_IDs.MAINNET],
        chainId: CHAIN_IDs.MAINNET,
        symbol: "USDT",
        decimals: TOKEN_SYMBOLS_MAP.USDT.decimals,
      },
      outputToken: USDH_SPOT_ON_HYPERCORE,
      amount: utils.parseUnits("100000", TOKEN_SYMBOLS_MAP.USDT.decimals),
      amountType: "exactInput" as const,
      recipient: "0x1234567890abcdef1234567890abcdef12345678",
      depositor: "0x1234567890abcdef1234567890abcdef12345678",
    };

    const result = await routeStrategyForSponsorship(params);
    expect(result).toEqual({ name: "oft-sponsored" });
  });
});

describe("routeStrategyForSponsorship - CCTP chain amount threshold preserved", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should route CCTP chain (Optimism USDC) to CCTP for amounts >= 10K", async () => {
    await mockEligibility({
      isCctpEnabledOriginChain: true,
      isMintBurnThresholdMet: true,
    });
    const params = {
      inputToken: {
        address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.OPTIMISM],
        chainId: CHAIN_IDs.OPTIMISM,
        symbol: "USDC",
        decimals: 6,
      },
      outputToken: USDH_SPOT_ON_HYPERCORE,
      amount: utils.parseUnits("10000", 6), // Exactly 10K
      amountType: "exactInput" as const,
      recipient: "0x1234567890abcdef1234567890abcdef12345678",
      depositor: "0x1234567890abcdef1234567890abcdef12345678",
    };

    const result = await routeStrategyForSponsorship(params);
    expect(result).toEqual({ name: "cctp-sponsored" });
  });

  it("should route CCTP chain (Optimism USDC) to intents for amounts < 10K", async () => {
    await mockEligibility({
      isCctpEnabledOriginChain: true,
      isMintBurnThresholdMet: false,
    });
    const params = {
      inputToken: {
        address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.OPTIMISM],
        chainId: CHAIN_IDs.OPTIMISM,
        symbol: "USDC",
        decimals: 6,
      },
      outputToken: USDH_SPOT_ON_HYPERCORE,
      amount: utils.parseUnits("9999", 6), // Just under 10K
      amountType: "exactInput" as const,
      recipient: "0x1234567890abcdef1234567890abcdef12345678",
      depositor: "0x1234567890abcdef1234567890abcdef12345678",
    };

    const result = await routeStrategyForSponsorship(params);
    expect(result).toEqual({ name: "sponsored-intent" });
  });
});

describe("routeStrategyForSponsorship - ANY to USDH-SPOT routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should route WETH -> USDH-SPOT to intents", async () => {
    await mockEligibility({
      isEligibleTokenPair: false,
      isHyperCoreIntentSupported: true,
    });

    const params = {
      inputToken: {
        address: TOKEN_SYMBOLS_MAP.WETH.addresses[CHAIN_IDs.MAINNET],
        chainId: CHAIN_IDs.MAINNET,
        symbol: "WETH",
        decimals: 18,
      },
      outputToken: USDH_SPOT_ON_HYPERCORE,
      amount: utils.parseUnits("1", 18),
      amountType: "exactInput" as const,
      recipient: "0x1234567890abcdef1234567890abcdef12345678",
      depositor: "0x1234567890abcdef1234567890abcdef12345678",
    };

    const result = await routeStrategyForSponsorship(params);
    expect(result).toEqual({ name: "across" });
  });

  it("should return null when hypercore intent not supported", async () => {
    await mockEligibility({
      isHyperCoreIntentSupported: false,
    });

    const params = {
      inputToken: {
        address: TOKEN_SYMBOLS_MAP.WETH.addresses[CHAIN_IDs.MAINNET],
        chainId: CHAIN_IDs.MAINNET,
        symbol: "WETH",
        decimals: 18,
      },
      outputToken: {
        symbol: "UNKNOWN",
        chainId: CHAIN_IDs.HYPERCORE,
        address: "0x1234567890abcdef1234567890abcdef12345678",
        decimals: 8,
      },
      amount: utils.parseUnits("1", 18),
      amountType: "exactInput" as const,
      recipient: "0x1234567890abcdef1234567890abcdef12345678",
      depositor: "0x1234567890abcdef1234567890abcdef12345678",
    };

    const result = await routeStrategyForSponsorship(params);
    expect(result).toBeNull();
  });
});
