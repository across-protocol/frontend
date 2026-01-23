import { beforeEach, describe, expect, it, vi } from "vitest";
import { BigNumber, utils } from "ethers";

import { routeStrategyForSponsorship } from "../../api/_sponsorship-routing";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../api/_constants";

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

vi.mock("../../api/_bridges/sponsored-intent/strategy", () => ({
  getUsdhIntentsBridgeStrategy: vi.fn(() => ({ name: "sponsored-intent" })),
}));

vi.mock("../../api/_bridges/sponsored-intent/utils/common", () => ({
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
    isSponsoredIntentSupported: true,
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

const USDH_SPOT_ON_HYPERCORE = {
  address: TOKEN_SYMBOLS_MAP["USDH-SPOT"].addresses[CHAIN_IDs.HYPERCORE],
  chainId: CHAIN_IDs.HYPERCORE,
  symbol: "USDH-SPOT",
  decimals: TOKEN_SYMBOLS_MAP["USDH-SPOT"].decimals,
};

const mockEligibility = async (
  overrides: Partial<{
    isEligibleTokenPair: boolean;
    isWithinInputAmountLimit: boolean;
    isWithinGlobalDailyLimit: boolean;
    isWithinUserDailyLimit: boolean;
    isWithinAccountCreationDailyLimit: boolean;
    isCctpEnabledOriginChain: boolean;
    isOftEnabledOriginChain: boolean;
    isSponsoredIntentSupported: boolean;
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
    isSponsoredIntentSupported: true,
    isMintBurnThresholdMet: true,
    ...overrides,
  });
};

describe("routeStrategyForSponsorship - USDT routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should route USDT to OFT strategy", async () => {
    await mockEligibility({ isOftEnabledOriginChain: true });
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
      amount: utils.parseUnits("1000", TOKEN_SYMBOLS_MAP.USDT.decimals),
      amountType: "exactInput" as const,
      recipient: "0x1234567890abcdef1234567890abcdef12345678",
      depositor: "0x1234567890abcdef1234567890abcdef12345678",
    };

    const result = await routeStrategyForSponsorship(params);
    expect(result).toEqual({ name: "oft-sponsored" });
  });
});

describe("routeStrategyForSponsorship - non-CCTP routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should route non-CCTP chain (zkSync USDC.e) to intents regardless of amount", async () => {
    await mockEligibility({
      isCctpEnabledOriginChain: false,
      isMintBurnThresholdMet: true,
    });
    const params = {
      inputToken: {
        address: TOKEN_SYMBOLS_MAP["USDC.e"].addresses[CHAIN_IDs.ZK_SYNC],
        chainId: CHAIN_IDs.ZK_SYNC,
        symbol: "USDC.e",
        decimals: 6,
      },
      outputToken: USDH_SPOT_ON_HYPERCORE,
      amount: utils.parseUnits("50000", 6), // 50K - above CCTP threshold
      amountType: "exactInput" as const,
      recipient: "0x1234567890abcdef1234567890abcdef12345678",
      depositor: "0x1234567890abcdef1234567890abcdef12345678",
    };

    const result = await routeStrategyForSponsorship(params);
    expect(result).toEqual({ name: "sponsored-intent" });
  });

  it("should route non-CCTP chain (Zora USDzC) to intents regardless of amount", async () => {
    await mockEligibility({
      isCctpEnabledOriginChain: false,
      isMintBurnThresholdMet: true,
    });
    const params = {
      inputToken: {
        address: TOKEN_SYMBOLS_MAP["USDzC"].addresses[CHAIN_IDs.ZORA],
        chainId: CHAIN_IDs.ZORA,
        symbol: "USDzC",
        decimals: 6,
      },
      outputToken: USDH_SPOT_ON_HYPERCORE,
      amount: utils.parseUnits("100000", 6), // 100K - well above CCTP threshold
      amountType: "exactInput" as const,
      recipient: "0x1234567890abcdef1234567890abcdef12345678",
      depositor: "0x1234567890abcdef1234567890abcdef12345678",
    };

    const result = await routeStrategyForSponsorship(params);
    expect(result).toEqual({ name: "sponsored-intent" });
  });

  it("should route non-CCTP chain (BSC USDC-BNB) to intents regardless of amount", async () => {
    await mockEligibility({
      isCctpEnabledOriginChain: false,
      isMintBurnThresholdMet: true,
    });
    const params = {
      inputToken: {
        address: TOKEN_SYMBOLS_MAP["USDC-BNB"].addresses[CHAIN_IDs.BSC],
        chainId: CHAIN_IDs.BSC,
        symbol: "USDC-BNB",
        decimals: TOKEN_SYMBOLS_MAP["USDC-BNB"].decimals,
      },
      outputToken: USDH_SPOT_ON_HYPERCORE,
      amount: utils.parseUnits("20000", TOKEN_SYMBOLS_MAP["USDC-BNB"].decimals),
      amountType: "exactInput" as const,
      recipient: "0x1234567890abcdef1234567890abcdef12345678",
      depositor: "0x1234567890abcdef1234567890abcdef12345678",
    };

    const result = await routeStrategyForSponsorship(params);
    expect(result).toEqual({ name: "sponsored-intent" });
  });

  it("should route non-CCTP chain (Scroll native USDC) to intents regardless of amount", async () => {
    await mockEligibility({
      isCctpEnabledOriginChain: false,
      isMintBurnThresholdMet: true,
    });
    const params = {
      inputToken: {
        address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.SCROLL],
        chainId: CHAIN_IDs.SCROLL,
        symbol: "USDC",
        decimals: 6,
      },
      outputToken: USDH_SPOT_ON_HYPERCORE,
      amount: utils.parseUnits("50000", 6), // 50K - above CCTP threshold
      amountType: "exactInput" as const,
      recipient: "0x1234567890abcdef1234567890abcdef12345678",
      depositor: "0x1234567890abcdef1234567890abcdef12345678",
    };

    const result = await routeStrategyForSponsorship(params);
    expect(result).toEqual({ name: "sponsored-intent" });
  });

  it("should route non-CCTP chain to intents even for small amounts", async () => {
    await mockEligibility({
      isCctpEnabledOriginChain: false,
      isMintBurnThresholdMet: false,
    });
    const params = {
      inputToken: {
        address: TOKEN_SYMBOLS_MAP["USDC.e"].addresses[CHAIN_IDs.MODE],
        chainId: CHAIN_IDs.MODE,
        symbol: "USDC.e",
        decimals: 6,
      },
      outputToken: USDH_SPOT_ON_HYPERCORE,
      amount: utils.parseUnits("100", 6), // 100 USD - well below CCTP threshold
      amountType: "exactInput" as const,
      recipient: "0x1234567890abcdef1234567890abcdef12345678",
      depositor: "0x1234567890abcdef1234567890abcdef12345678",
    };

    const result = await routeStrategyForSponsorship(params);
    expect(result).toEqual({ name: "sponsored-intent" });
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

  it("should return null for unsupported route", async () => {
    await mockEligibility();
    const { isRouteSupported } = await import(
      "../../api/_bridges/sponsored-intent/utils/common"
    );
    (isRouteSupported as ReturnType<typeof vi.fn>).mockReturnValue(false);

    const params = {
      inputToken: {
        address: "0x1234567890abcdef1234567890abcdef12345678",
        chainId: 999999,
        symbol: "UNKNOWN",
        decimals: 6,
      },
      outputToken: USDH_SPOT_ON_HYPERCORE,
      amount: utils.parseUnits("1000", 6),
      amountType: "exactInput" as const,
      recipient: "0x1234567890abcdef1234567890abcdef12345678",
      depositor: "0x1234567890abcdef1234567890abcdef12345678",
    };

    const result = await routeStrategyForSponsorship(params);
    expect(result).toBeNull();
  });
});
