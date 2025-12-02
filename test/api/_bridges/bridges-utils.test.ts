import { BigNumber } from "ethers";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../../api/_constants";
import {
  getBridgeStrategyData,
  isFullyUtilized,
} from "../../../api/_bridges/utils";
import { Token } from "../../../api/_dexes/types";
import { LimitsResponse } from "../../../api/_types";
import { getCachedLimits } from "../../../api/_utils";

jest.mock("../../../api/_utils", () => ({
  ...jest.requireActual("../../../api/_utils"),
  getCachedLimits: jest.fn(),
}));

// Helper function to create a token on a specific chain
const createToken = (
  tokenSymbol: keyof typeof TOKEN_SYMBOLS_MAP,
  chainId: number
): Token => ({
  ...TOKEN_SYMBOLS_MAP[tokenSymbol],
  chainId,
  address: TOKEN_SYMBOLS_MAP[tokenSymbol].addresses[chainId],
});

// Helper for LimitsResponse mocking
const mockLimitsResponse = (
  overrides: Partial<LimitsResponse> = {}
): LimitsResponse => {
  const defaults: LimitsResponse = {
    minDeposit: "1000000",
    maxDeposit: "1000000000000",
    maxDepositInstant: "100000000000",
    maxDepositShortDelay: "500000000000",
    recommendedDepositInstant: "50000000000",
    relayerFeeDetails: {
      relayFeeTotal: "1000",
      relayFeePercent: "0.001",
      capitalFeePercent: "0.0005",
      capitalFeeTotal: "500",
      gasFeePercent: "0.0001",
      gasFeeTotal: "100",
    },
    reserves: {
      liquidReserves: "10000000000000",
      utilizedReserves: "5000000000000",
    },
  };

  return {
    ...defaults,
    ...overrides,
    reserves: {
      ...defaults.reserves,
      ...overrides.reserves,
    },
    relayerFeeDetails: {
      ...defaults.relayerFeeDetails,
      ...overrides.relayerFeeDetails,
    },
  };
};

// Common test tokens
const usdcOptimism = createToken("USDC", CHAIN_IDs.OPTIMISM);
const usdcArbitrum = createToken("USDC", CHAIN_IDs.ARBITRUM);
const usdcMonad = createToken("USDC", CHAIN_IDs.MONAD);
const usdcPolygon = createToken("USDC", CHAIN_IDs.POLYGON);
const usdcLinea = createToken("USDC", CHAIN_IDs.LINEA);
const usdtMainnet = createToken("USDT", CHAIN_IDs.MAINNET);
const usdtArbitrum = createToken("USDT", CHAIN_IDs.ARBITRUM);
const wethOptimism = createToken("WETH", CHAIN_IDs.OPTIMISM);
const wethArbitrum = createToken("WETH", CHAIN_IDs.ARBITRUM);

describe("#getBridgeStrategyData()", () => {
  const baseParams = {
    depositor: "0x1234567890123456789012345678901234567890",
    amountType: "exactInput" as const,
  };

  beforeEach(() => {
    // Reset and setup mock before each test
    (getCachedLimits as jest.Mock).mockReset();
    (getCachedLimits as jest.Mock).mockResolvedValue(mockLimitsResponse());
  });

  describe("Utilization checks", () => {
    test("should return true when utilization is above 80%", () => {
      const limits = mockLimitsResponse({
        reserves: {
          liquidReserves: "100000000000",
          utilizedReserves: "500000000000", // 83.3% utilization
        },
      });

      expect(isFullyUtilized(limits)).toBe(true);
    });

    test("should return false when utilization is below 80%", () => {
      const limits = mockLimitsResponse({
        reserves: {
          liquidReserves: "200000000000",
          utilizedReserves: "100000000000", // 33.3% utilization
        },
      });

      expect(isFullyUtilized(limits)).toBe(false);
    });

    test("should floor negative utilized reserves to zero", () => {
      const limits = mockLimitsResponse({
        reserves: {
          liquidReserves: "100000000000",
          utilizedReserves: "-1000",
        },
      });

      expect(isFullyUtilized(limits)).toBe(false);
    });
  });

  describe("Token symbol checks", () => {
    test("should identify USDC to USDC transfers", async () => {
      const amount = BigNumber.from("1000000"); // 1 USDC

      const result = await getBridgeStrategyData({
        ...baseParams,
        inputToken: usdcOptimism,
        outputToken: usdcArbitrum,
        amount,
      });

      expect(result?.isUsdcToUsdc).toBe(true);
      expect(result?.isUsdtToUsdt).toBe(false);
    });

    test("should identify USDT to USDT transfers", async () => {
      const amount = BigNumber.from("1000000"); // 1 USDT

      const result = await getBridgeStrategyData({
        ...baseParams,
        inputToken: usdtMainnet,
        outputToken: usdtArbitrum,
        amount,
      });

      expect(result?.isUsdtToUsdt).toBe(true);
      expect(result?.isUsdcToUsdc).toBe(false);
    });

    test("should identify non-USDC/USDT transfers", async () => {
      const amount = BigNumber.from("1000000000000000000"); // 1 ETH

      const result = await getBridgeStrategyData({
        ...baseParams,
        inputToken: wethOptimism,
        outputToken: wethArbitrum,
        amount,
      });

      expect(result?.isUsdcToUsdc).toBe(false);
      expect(result?.isUsdtToUsdt).toBe(false);
    });
  });

  describe("Amount thresholds", () => {
    test("should identify deposits within 10K threshold", async () => {
      const amount = BigNumber.from("5000000"); // 5 USDC

      const result = await getBridgeStrategyData({
        ...baseParams,
        inputToken: usdcOptimism,
        outputToken: usdcArbitrum,
        amount,
      });

      expect(result?.isInThreshold).toBe(true);
      expect(result?.isLargeDeposit).toBe(false);
    });

    test("should identify deposits exceeding 10K threshold", async () => {
      const amount = BigNumber.from("15000000000"); // 15,000 USDC

      const result = await getBridgeStrategyData({
        ...baseParams,
        inputToken: usdcOptimism,
        outputToken: usdcArbitrum,
        amount,
      });

      expect(result?.isInThreshold).toBe(false);
      expect(result?.isLargeDeposit).toBe(false);
    });

    test("should identify large deposits exceeding 1M threshold", async () => {
      const amount = BigNumber.from("2000000000000"); // 2M USDC

      const result = await getBridgeStrategyData({
        ...baseParams,
        inputToken: usdcOptimism,
        outputToken: usdcArbitrum,
        amount,
      });

      expect(result?.isInThreshold).toBe(false);
      expect(result?.isLargeDeposit).toBe(true);
    });

    describe("Instant fill checks", () => {
      test("should identify when deposit can be filled instantly", async () => {
        const amount = BigNumber.from("50000000"); // 50 USDC
        const limits = mockLimitsResponse({
          maxDepositInstant: "100000000", // 100 USDC
        });
        (getCachedLimits as jest.Mock).mockResolvedValue(limits);

        const result = await getBridgeStrategyData({
          ...baseParams,
          inputToken: usdcOptimism,
          outputToken: usdcArbitrum,
          amount,
        });

        expect(result?.canFillInstantly).toBe(true);
      });

      test("should identify when deposit cannot be filled instantly", async () => {
        const amount = BigNumber.from("150000000"); // 150 USDC
        const limits = mockLimitsResponse({
          maxDepositInstant: "100000000", // 100 USDC
        });
        (getCachedLimits as jest.Mock).mockResolvedValue(limits);

        const result = await getBridgeStrategyData({
          ...baseParams,
          inputToken: usdcOptimism,
          outputToken: usdcArbitrum,
          amount,
        });

        expect(result?.canFillInstantly).toBe(false);
      });
    });

    describe("Utilization checks", () => {
      test("should detect high utilization", async () => {
        const amount = BigNumber.from("1000000"); // 1 USDC
        const limits = mockLimitsResponse({
          reserves: {
            liquidReserves: "100000000000",
            utilizedReserves: "500000000000", // 83.3% utilization
          },
        });
        (getCachedLimits as jest.Mock).mockResolvedValue(limits);

        const result = await getBridgeStrategyData({
          ...baseParams,
          inputToken: usdcOptimism,
          outputToken: usdcArbitrum,
          amount,
        });

        expect(result?.isUtilizationHigh).toBe(true);
      });

      test("should detect low utilization", async () => {
        const amount = BigNumber.from("1000000"); // 1 USDC
        const limits = mockLimitsResponse({
          reserves: {
            liquidReserves: "200000000000",
            utilizedReserves: "100000000000", // 33.3% utilization
          },
        });
        (getCachedLimits as jest.Mock).mockResolvedValue(limits);

        const result = await getBridgeStrategyData({
          ...baseParams,
          inputToken: usdcOptimism,
          outputToken: usdcArbitrum,
          amount,
        });

        expect(result?.isUtilizationHigh).toBe(false);
      });
    });

    describe("Chain specific checks", () => {
      test("should identify Fast CCTP eligible transfers (Arbitrum > 10K)", async () => {
        const amount = BigNumber.from("15000000000"); // 15,000 USDC

        const result = await getBridgeStrategyData({
          ...baseParams,
          inputToken: usdcArbitrum,
          outputToken: usdcPolygon,
          amount,
        });

        expect(result?.isFastCctpEligible).toBe(true);
      });

      test("should not mark Fast CCTP eligible for Arbitrum <= 10K", async () => {
        const amount = BigNumber.from("5000000"); // 5 USDC

        const result = await getBridgeStrategyData({
          ...baseParams,
          inputToken: usdcArbitrum,
          outputToken: usdcPolygon,
          amount,
        });

        expect(result?.isFastCctpEligible).toBe(false);
      });

      test("should not mark Fast CCTP eligible for non-Fast-CCTP chains", async () => {
        const amount = BigNumber.from("15000000000"); // 15,000 USDC

        const result = await getBridgeStrategyData({
          ...baseParams,
          inputToken: usdcPolygon,
          outputToken: usdcArbitrum,
          amount,
        });

        expect(result?.isFastCctpEligible).toBe(false);
      });

      test("should identify transfers from Monad", async () => {
        const amount = BigNumber.from("1000000"); // 1 USDC

        const result = await getBridgeStrategyData({
          ...baseParams,
          inputToken: usdcMonad,
          outputToken: usdcArbitrum,
          amount,
        });

        expect(result?.isMonadTransfer).toBe(true);
      });

      test("should identify transfers to Monad", async () => {
        const amount = BigNumber.from("1000000"); // 1 USDC

        const result = await getBridgeStrategyData({
          ...baseParams,
          inputToken: usdcOptimism,
          outputToken: usdcMonad,
          amount,
        });

        expect(result?.isMonadTransfer).toBe(true);
      });

      test("should check if within Monad limit (25K)", async () => {
        const amount = BigNumber.from("20000000000"); // 20,000 USDC

        const result = await getBridgeStrategyData({
          ...baseParams,
          inputToken: usdcMonad,
          outputToken: usdcArbitrum,
          amount,
        });

        expect(result?.isWithinMonadLimit).toBe(true);
      });

      test("should check if exceeding Monad limit (25K)", async () => {
        const amount = BigNumber.from("30000000000"); // 30,000 USDC

        const result = await getBridgeStrategyData({
          ...baseParams,
          inputToken: usdcMonad,
          outputToken: usdcArbitrum,
          amount,
        });

        expect(result?.isWithinMonadLimit).toBe(false);
      });
    });

    describe("Amount type conversions", () => {
      test("should handle exactInput amount type", async () => {
        const amount = BigNumber.from("1000000"); // 1 USDC

        const result = await getBridgeStrategyData({
          ...baseParams,
          inputToken: usdcOptimism,
          outputToken: usdcArbitrum,
          amount,
          amountType: "exactInput",
        });

        expect(result).toBeDefined();
      });

      test("should convert exactOutput amount to input decimals", async () => {
        const amount = BigNumber.from("1000000"); // 1 USDC output
        const limits = mockLimitsResponse({
          maxDepositInstant: "1000000", // Should match converted amount
        });
        (getCachedLimits as jest.Mock).mockResolvedValue(limits);

        const result = await getBridgeStrategyData({
          ...baseParams,
          inputToken: usdcOptimism,
          outputToken: usdcArbitrum,
          amount,
          amountType: "exactOutput",
        });

        expect(result).toBeDefined();
        expect(result?.canFillInstantly).toBe(true);
      });

      test("should convert minOutput amount to input decimals", async () => {
        const amount = BigNumber.from("1000000"); // 1 USDC output

        const result = await getBridgeStrategyData({
          ...baseParams,
          inputToken: usdcOptimism,
          outputToken: usdcArbitrum,
          amount,
          amountType: "minOutput",
        });

        expect(result).toBeDefined();
      });
    });

    describe("Error handling", () => {
      test("should return undefined when getCachedLimits throws error", async () => {
        const amount = BigNumber.from("1000000");
        (getCachedLimits as jest.Mock).mockRejectedValue(
          new Error("API error")
        );

        const result = await getBridgeStrategyData({
          ...baseParams,
          inputToken: usdcOptimism,
          outputToken: usdcArbitrum,
          amount,
        });

        expect(result).toBeUndefined();
      });
    });
  });
});
