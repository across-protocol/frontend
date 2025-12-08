import { BigNumber } from "ethers";
import { routeMintAndBurnStrategy } from "../../../../../api/_bridges/routing";
import * as bridgeUtils from "../../../../../api/_bridges/utils";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../../../../api/_constants";
import { BridgeStrategyData } from "../../../../../api/_bridges/types";

jest.mock("../../../../../api/_bridges/utils");

// mock the logger
jest.mock("../../../../../api/_logger", () => ({
  getLogger: jest.fn().mockReturnValue({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

const mockedGetBridgeStrategyData =
  bridgeUtils.getBridgeStrategyData as jest.MockedFunction<
    typeof bridgeUtils.getBridgeStrategyData
  >;

describe("api/_bridges/cctp/utils/routing", () => {
  const usdcOptimism = {
    ...TOKEN_SYMBOLS_MAP.USDC,
    address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.OPTIMISM],
    chainId: CHAIN_IDs.OPTIMISM,
    decimals: 6,
  };

  const usdcArbitrum = {
    ...TOKEN_SYMBOLS_MAP.USDC,
    address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.ARBITRUM],
    chainId: CHAIN_IDs.ARBITRUM,
    decimals: 6,
  };

  const baseParams = {
    inputToken: usdcOptimism,
    outputToken: usdcArbitrum,
    amount: BigNumber.from("100000000"), // 100 USDC
    amountType: "exactInput" as const,
    depositor: "0x1234567890123456789012345678901234567890",
    recipient: "0x1234567890123456789012345678901234567890",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("routeMintAndBurnStrategy", () => {
    const buildStrategyData = (
      overrides: Partial<NonNullable<BridgeStrategyData>> = {}
    ): BridgeStrategyData => ({
      canFillInstantly: false,
      isUtilizationHigh: false,
      isUsdcToUsdc: true,
      isLargeCctpDeposit: false,
      isFastCctpEligible: false,
      isInThreshold: false,
      isUsdtToUsdt: false,
      isMonadTransfer: false,
      isWithinMonadLimit: false,
      ...overrides,
    });

    it("returns Across for routes that are neither USDC nor USDT", async () => {
      mockedGetBridgeStrategyData.mockResolvedValue(
        buildStrategyData({
          isUsdcToUsdc: false,
          isUsdtToUsdt: false,
        })
      );

      const result = await routeMintAndBurnStrategy(baseParams);

      expect(result?.name).toBe("across");
    });

    it("keeps Monad transfers within the lite limit on Across", async () => {
      mockedGetBridgeStrategyData.mockResolvedValue(
        buildStrategyData({
          isMonadTransfer: true,
          isWithinMonadLimit: true,
        })
      );

      const result = await routeMintAndBurnStrategy(baseParams);

      expect(result?.name).toBe("across");
    });

    it("routes Monad USDT transfers over OFT", async () => {
      mockedGetBridgeStrategyData.mockResolvedValue(
        buildStrategyData({
          isMonadTransfer: true,
          isWithinMonadLimit: false,
          isUsdcToUsdc: false,
          isUsdtToUsdt: true,
        })
      );

      const result = await routeMintAndBurnStrategy(baseParams);

      expect(result?.name).toBe("oft");
    });

    it("routes Monad USDC transfers over CCTP", async () => {
      mockedGetBridgeStrategyData.mockResolvedValue(
        buildStrategyData({
          isMonadTransfer: true,
          isWithinMonadLimit: false,
          isUsdcToUsdc: true,
        })
      );

      const result = await routeMintAndBurnStrategy(baseParams);

      expect(result?.name).toBe("cctp");
    });

    it("uses burn-and-mint routes when utilization is high", async () => {
      mockedGetBridgeStrategyData.mockResolvedValue(
        buildStrategyData({
          isUtilizationHigh: true,
        })
      );

      const result = await routeMintAndBurnStrategy(baseParams);

      expect(result?.name).toBe("cctp");
    });

    it("uses burn-and-mint on fast CCTP chains for medium deposits", async () => {
      mockedGetBridgeStrategyData.mockResolvedValue(
        buildStrategyData({
          isFastCctpEligible: true,
          isInThreshold: false,
          isLargeCctpDeposit: false,
        })
      );

      const result = await routeMintAndBurnStrategy(baseParams);

      expect(result?.name).toBe("cctp");
    });

    it("keeps small deposits on fast CCTP chains on Across", async () => {
      mockedGetBridgeStrategyData.mockResolvedValue(
        buildStrategyData({
          isFastCctpEligible: true,
          isInThreshold: true,
        })
      );

      const result = await routeMintAndBurnStrategy(baseParams);

      expect(result?.name).toBe("across");
    });

    it("keeps instant-fill deposits on Across", async () => {
      mockedGetBridgeStrategyData.mockResolvedValue(
        buildStrategyData({
          canFillInstantly: true,
        })
      );

      const result = await routeMintAndBurnStrategy(baseParams);

      expect(result?.name).toBe("across");
    });

    it("keeps large USDC deposits on Across", async () => {
      mockedGetBridgeStrategyData.mockResolvedValue(
        buildStrategyData({
          isUsdcToUsdc: true,
          isLargeCctpDeposit: true,
        })
      );

      const result = await routeMintAndBurnStrategy(baseParams);

      expect(result?.name).toBe("across");
    });

    it("defaults to CCTP for standard USDC routes", async () => {
      mockedGetBridgeStrategyData.mockResolvedValue(buildStrategyData());

      const result = await routeMintAndBurnStrategy(baseParams);

      expect(result?.name).toBe("cctp");
    });

    it("defaults to OFT for standard USDT routes", async () => {
      mockedGetBridgeStrategyData.mockResolvedValue(
        buildStrategyData({
          isUsdcToUsdc: false,
          isUsdtToUsdt: true,
        })
      );

      const result = await routeMintAndBurnStrategy(baseParams);

      expect(result?.name).toBe("oft");
    });

    it("falls back to Across when no bridge data is available", async () => {
      mockedGetBridgeStrategyData.mockResolvedValue(undefined);

      const result = await routeMintAndBurnStrategy(baseParams);

      expect(result?.name).toBe("across");
    });
  });
});
