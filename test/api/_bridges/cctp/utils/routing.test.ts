import { BigNumber } from "ethers";
import { routeStrategyForCctp } from "../../../../../api/_bridges/cctp/utils/routing";
import * as bridgeUtils from "../../../../../api/_bridges/utils";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../../../../api/_constants";
import { BridgeStrategyData } from "../../../../../api/_bridges/types";

jest.mock("../../../../../api/_bridges/utils");

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
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("routeStrategyForCctp", () => {
    describe("Rule 1: non-usdc-route", () => {
      it("should return Across for non-USDC pairs", async () => {
        const strategyData: BridgeStrategyData = {
          isUsdcToUsdc: false,
          isUtilizationHigh: false,
          isLineaSource: false,
          isLargeDeposit: false,
          isFastCctpEligible: false,
          isInThreshold: true,
          canFillInstantly: true,
        };
        mockedGetBridgeStrategyData.mockResolvedValue(strategyData);

        const result = await routeStrategyForCctp(baseParams);

        expect(result.name).toBe("across");
      });

      it("should prioritize non-USDC rule over high utilization", async () => {
        const strategyData: BridgeStrategyData = {
          isUsdcToUsdc: false,
          isUtilizationHigh: true,
          isLineaSource: false,
          isLargeDeposit: false,
          isFastCctpEligible: false,
          isInThreshold: true,
          canFillInstantly: true,
        };
        mockedGetBridgeStrategyData.mockResolvedValue(strategyData);

        const result = await routeStrategyForCctp(baseParams);

        expect(result.name).toBe("across");
      });
    });

    describe("Rule 2: high-utilization", () => {
      it("should return CCTP when utilization is high (>80%)", async () => {
        const strategyData: BridgeStrategyData = {
          isUsdcToUsdc: true,
          isUtilizationHigh: true,
          isLineaSource: false,
          isLargeDeposit: false,
          isFastCctpEligible: false,
          isInThreshold: true,
          canFillInstantly: true,
        };
        mockedGetBridgeStrategyData.mockResolvedValue(strategyData);

        const result = await routeStrategyForCctp(baseParams);

        expect(result.name).toBe("cctp");
      });

      it("should prioritize high utilization over Linea exclusion", async () => {
        const strategyData: BridgeStrategyData = {
          isUsdcToUsdc: true,
          isUtilizationHigh: true,
          isLineaSource: true,
          isLargeDeposit: false,
          isFastCctpEligible: false,
          isInThreshold: true,
          canFillInstantly: true,
        };
        mockedGetBridgeStrategyData.mockResolvedValue(strategyData);

        const result = await routeStrategyForCctp(baseParams);

        expect(result.name).toBe("cctp");
      });
    });

    describe("Rule 3: linea-exclusion", () => {
      it("should return Across when source chain is Linea", async () => {
        const strategyData: BridgeStrategyData = {
          isUsdcToUsdc: true,
          isUtilizationHigh: false,
          isLineaSource: true,
          isLargeDeposit: false,
          isFastCctpEligible: false,
          isInThreshold: true,
          canFillInstantly: true,
        };
        mockedGetBridgeStrategyData.mockResolvedValue(strategyData);

        const result = await routeStrategyForCctp(baseParams);

        expect(result.name).toBe("across");
      });
    });

    describe("Rule 4: fast-cctp-small-deposit", () => {
      it("should return CCTP for medium deposits on fast CCTP chains", async () => {
        const strategyData: BridgeStrategyData = {
          isUsdcToUsdc: true,
          isUtilizationHigh: false,
          isLineaSource: false,
          isLargeDeposit: false,
          isFastCctpEligible: true,
          isInThreshold: false,
          canFillInstantly: false,
        };
        mockedGetBridgeStrategyData.mockResolvedValue(strategyData);

        const result = await routeStrategyForCctp(baseParams);

        expect(result.name).toBe("cctp");
      });

      it("should not apply for deposits within threshold", async () => {
        const strategyData: BridgeStrategyData = {
          isUsdcToUsdc: true,
          isUtilizationHigh: false,
          isLineaSource: false,
          isLargeDeposit: false,
          isFastCctpEligible: true,
          isInThreshold: true,
          canFillInstantly: false,
        };
        mockedGetBridgeStrategyData.mockResolvedValue(strategyData);

        const result = await routeStrategyForCctp(baseParams);

        expect(result.name).toBe("across");
      });

      it("should not apply for large deposits", async () => {
        const strategyData: BridgeStrategyData = {
          isUsdcToUsdc: true,
          isUtilizationHigh: false,
          isLineaSource: false,
          isLargeDeposit: true,
          isFastCctpEligible: true,
          isInThreshold: false,
          canFillInstantly: false,
        };
        mockedGetBridgeStrategyData.mockResolvedValue(strategyData);

        const result = await routeStrategyForCctp(baseParams);

        expect(result.name).toBe("across");
      });
    });

    describe("Rule 5: fast-cctp-threshold-or-large", () => {
      it("should return Across for very small deposits (<$10K) on fast CCTP chains", async () => {
        const strategyData: BridgeStrategyData = {
          isUsdcToUsdc: true,
          isUtilizationHigh: false,
          isLineaSource: false,
          isLargeDeposit: false,
          isFastCctpEligible: true,
          isInThreshold: true,
          canFillInstantly: false,
        };
        mockedGetBridgeStrategyData.mockResolvedValue(strategyData);

        const result = await routeStrategyForCctp(baseParams);

        expect(result.name).toBe("across");
      });

      it("should return Across for very large deposits (>$1M) on fast CCTP chains", async () => {
        const strategyData: BridgeStrategyData = {
          isUsdcToUsdc: true,
          isUtilizationHigh: false,
          isLineaSource: false,
          isLargeDeposit: true,
          isFastCctpEligible: true,
          isInThreshold: false,
          canFillInstantly: false,
        };
        mockedGetBridgeStrategyData.mockResolvedValue(strategyData);

        const result = await routeStrategyForCctp(baseParams);

        expect(result.name).toBe("across");
      });
    });

    describe("Rule 6: instant-fill", () => {
      it("should return Across when deposit can be filled instantly", async () => {
        const strategyData: BridgeStrategyData = {
          isUsdcToUsdc: true,
          isUtilizationHigh: false,
          isLineaSource: false,
          isLargeDeposit: false,
          isFastCctpEligible: false,
          isInThreshold: true,
          canFillInstantly: true,
        };
        mockedGetBridgeStrategyData.mockResolvedValue(strategyData);

        const result = await routeStrategyForCctp(baseParams);

        expect(result.name).toBe("across");
      });
    });

    describe("Rule 7: large-deposit-fallback", () => {
      it("should return Across for large deposits (>$1M)", async () => {
        const strategyData: BridgeStrategyData = {
          isUsdcToUsdc: true,
          isUtilizationHigh: false,
          isLineaSource: false,
          isLargeDeposit: true,
          isFastCctpEligible: false,
          isInThreshold: false,
          canFillInstantly: false,
        };
        mockedGetBridgeStrategyData.mockResolvedValue(strategyData);

        const result = await routeStrategyForCctp(baseParams);

        expect(result.name).toBe("across");
      });
    });

    describe("Rule 8: default-cctp", () => {
      it("should return CCTP for standard USDC routes", async () => {
        const strategyData: BridgeStrategyData = {
          isUsdcToUsdc: true,
          isUtilizationHigh: false,
          isLineaSource: false,
          isLargeDeposit: false,
          isFastCctpEligible: false,
          isInThreshold: false,
          canFillInstantly: false,
        };
        mockedGetBridgeStrategyData.mockResolvedValue(strategyData);

        const result = await routeStrategyForCctp(baseParams);

        expect(result.name).toBe("cctp");
      });
    });

    describe("Edge cases and fallbacks", () => {
      it("should return Across when bridge strategy data is undefined", async () => {
        mockedGetBridgeStrategyData.mockResolvedValue(undefined);

        const result = await routeStrategyForCctp(baseParams);

        expect(result.name).toBe("across");
      });

      it("should handle getBridgeStrategyData errors by returning undefined", async () => {
        mockedGetBridgeStrategyData.mockResolvedValue(undefined);

        const result = await routeStrategyForCctp(baseParams);

        expect(result.name).toBe("across");
      });
    });

    describe("Rule priority validation", () => {
      it("should prioritize non-USDC over all other rules", async () => {
        const strategyData: BridgeStrategyData = {
          isUsdcToUsdc: false,
          isUtilizationHigh: true,
          isLineaSource: true,
          isLargeDeposit: true,
          isFastCctpEligible: true,
          isInThreshold: false,
          canFillInstantly: true,
        };
        mockedGetBridgeStrategyData.mockResolvedValue(strategyData);

        const result = await routeStrategyForCctp(baseParams);

        expect(result.name).toBe("across");
      });

      it("should prioritize high utilization over lower priority rules", async () => {
        const strategyData: BridgeStrategyData = {
          isUsdcToUsdc: true,
          isUtilizationHigh: true,
          isLineaSource: true,
          isLargeDeposit: true,
          isFastCctpEligible: true,
          isInThreshold: false,
          canFillInstantly: true,
        };
        mockedGetBridgeStrategyData.mockResolvedValue(strategyData);

        const result = await routeStrategyForCctp(baseParams);

        expect(result.name).toBe("cctp");
      });

      it("should prioritize Linea exclusion over fast CCTP rules", async () => {
        const strategyData: BridgeStrategyData = {
          isUsdcToUsdc: true,
          isUtilizationHigh: false,
          isLineaSource: true,
          isLargeDeposit: false,
          isFastCctpEligible: true,
          isInThreshold: false,
          canFillInstantly: false,
        };
        mockedGetBridgeStrategyData.mockResolvedValue(strategyData);

        const result = await routeStrategyForCctp(baseParams);

        expect(result.name).toBe("across");
      });

      it("should prioritize fast CCTP rules over instant fill", async () => {
        const strategyData: BridgeStrategyData = {
          isUsdcToUsdc: true,
          isUtilizationHigh: false,
          isLineaSource: false,
          isLargeDeposit: false,
          isFastCctpEligible: true,
          isInThreshold: false,
          canFillInstantly: true,
        };
        mockedGetBridgeStrategyData.mockResolvedValue(strategyData);

        const result = await routeStrategyForCctp(baseParams);

        expect(result.name).toBe("cctp");
      });
    });
  });
});
