import { ethers } from "ethers";
import axios from "axios";

import {
  getL2OrderBookForPair,
  simulateMarketOrder,
  isHyperEvmToHyperCoreRoute,
  assertAccountExistsOnHyperCore,
  HypercoreAccountNotInitializedError,
} from "../../api/_hypercore";
import { TOKEN_SYMBOLS_MAP } from "../../api/_constants";
import { CHAIN_IDs } from "../../api/_constants";
import { getProvider } from "../../api/_providers";

jest.mock("axios");
jest.mock("../../api/_providers", () => ({
  getProvider: jest.fn(),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedGetProvider = getProvider as jest.MockedFunction<
  typeof getProvider
>;

type MockOrderBookData = Awaited<ReturnType<typeof getL2OrderBookForPair>>;

describe("api/_hypercore.ts", () => {
  const usdc = {
    symbol: "USDC",
    decimals: 8,
  };
  const usdh = {
    symbol: "USDH",
    decimals: 8,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("#simulateMarketOrder()", () => {
    const mockOrderBookData: MockOrderBookData = {
      coin: "@230",
      time: 1760575824177,
      levels: [
        [
          {
            px: "0.99979",
            sz: "29350.7",
            n: 2,
          },
          {
            px: "0.99978",
            sz: "101825.22",
            n: 5,
          },
          {
            px: "0.99977",
            sz: "32000.0",
            n: 1,
          },
          {
            px: "0.99976",
            sz: "32000.0",
            n: 1,
          },
          {
            px: "0.99974",
            sz: "500.0",
            n: 1,
          },
        ],
        [
          {
            px: "0.99983",
            sz: "2104.57",
            n: 5,
          },
          {
            px: "0.99987",
            sz: "32000.0",
            n: 1,
          },
          {
            px: "0.99988",
            sz: "32000.0",
            n: 1,
          },
          {
            px: "0.99989",
            sz: "32000.0",
            n: 1,
          },
          {
            px: "0.9999",
            sz: "32000.0",
            n: 1,
          },
          {
            px: "1.0",
            sz: "679285.61",
            n: 4,
          },
          {
            px: "1.0001",
            sz: "365649.27",
            n: 55,
          },
        ],
      ],
    };

    describe("amountType: input", () => {
      test("should simulate buying USDH with USDC (small order)", async () => {
        mockedAxios.post.mockResolvedValue({ data: mockOrderBookData });

        const result = await simulateMarketOrder({
          tokenIn: usdc,
          tokenOut: usdh,
          amount: ethers.utils.parseUnits("1000", usdc.decimals),
          amountType: "input",
        });

        // At best price of 0.99983, 1000 USDC should buy approximately 1000.17 USDH
        expect(result.fullyFilled).toBe(true);
        expect(result.levelsConsumed).toBe(1);
        expect(result.bestPrice).toBe("0.99983");

        // Output should be close to 1000 / 0.99983 ≈ 1000.17
        const outputAmount = parseFloat(
          ethers.utils.formatUnits(result.outputAmount, usdh.decimals)
        );
        expect(outputAmount).toBeGreaterThan(1000);
        expect(outputAmount).toBeLessThan(1001);

        // Slippage should be minimal for small order
        expect(result.slippagePercent).toBeGreaterThanOrEqual(0);
        expect(result.slippagePercent).toBeLessThan(0.05);
      });

      test("should simulate buying USDH with USDC (large order consuming multiple levels)", async () => {
        mockedAxios.post.mockResolvedValue({ data: mockOrderBookData });

        const result = await simulateMarketOrder({
          tokenIn: usdc,
          tokenOut: usdh,
          amount: ethers.utils.parseUnits("100000", usdc.decimals),
          amountType: "input",
        });

        expect(result.fullyFilled).toBe(true);
        expect(result.levelsConsumed).toBeGreaterThan(1);
        expect(result.bestPrice).toBe("0.99983");

        // Should have consumed multiple levels
        const outputAmount = parseFloat(
          ethers.utils.formatUnits(result.outputAmount, usdh.decimals)
        );
        expect(outputAmount).toBeGreaterThan(99000);
        expect(outputAmount).toBeLessThan(101000);

        // Slippage should be higher for larger order
        expect(result.slippagePercent).toBeGreaterThan(0);
      });

      test("should simulate selling USDH for USDC", async () => {
        mockedAxios.post.mockResolvedValue({ data: mockOrderBookData });

        const result = await simulateMarketOrder({
          tokenIn: usdh,
          tokenOut: usdc,
          amount: ethers.utils.parseUnits("1000", usdh.decimals),
          amountType: "input",
        });

        expect(result.fullyFilled).toBe(true);
        expect(result.levelsConsumed).toBe(1);
        expect(result.bestPrice).toBe("0.99979");

        // At best price of 0.99979, 1000 USDH should sell for approximately 999.79 USDC
        const outputAmount = parseFloat(
          ethers.utils.formatUnits(result.outputAmount, usdc.decimals)
        );
        expect(outputAmount).toBeGreaterThan(999);
        expect(outputAmount).toBeLessThan(1000);

        // Slippage should be minimal for small order
        expect(result.slippagePercent).toBeGreaterThanOrEqual(0);
        expect(result.slippagePercent).toBeLessThan(0.01);
      });

      test("should handle partial fills when order size exceeds available liquidity", async () => {
        const limitedLiquidityOrderBook: MockOrderBookData = {
          coin: "@230",
          time: 1760575824177,
          levels: [
            [
              {
                px: "0.99979",
                sz: "1000.0",
                n: 1,
              },
            ],
            [
              {
                px: "0.99983",
                sz: "1000.0",
                n: 1,
              },
            ],
          ],
        };

        mockedAxios.post.mockResolvedValue({ data: limitedLiquidityOrderBook });

        const result = await simulateMarketOrder({
          tokenIn: usdc,
          tokenOut: usdh,
          amount: ethers.utils.parseUnits("2000", usdc.decimals),
          amountType: "input",
        });

        // Should only partially fill
        expect(result.fullyFilled).toBe(false);

        // Should have consumed only the available liquidity
        const inputUsed = parseFloat(
          ethers.utils.formatUnits(result.inputAmount, usdc.decimals)
        );
        expect(inputUsed).toBeLessThan(2000);
        expect(inputUsed).toBeGreaterThan(999);
      });

      test("should calculate average execution price correctly", async () => {
        mockedAxios.post.mockResolvedValue({ data: mockOrderBookData });

        const result = await simulateMarketOrder({
          tokenIn: usdc,
          tokenOut: usdh,
          amount: ethers.utils.parseUnits("50000", usdc.decimals),
          amountType: "input",
        });

        const avgPrice = parseFloat(result.averageExecutionPrice);
        const bestPrice = parseFloat(result.bestPrice);

        // Average price should be worse (higher) than best price when buying
        expect(avgPrice).toBeGreaterThan(bestPrice);

        // Verify calculation: when buying base, price = inputAmount / outputAmount (quote per base)
        const outputAmount = parseFloat(
          ethers.utils.formatUnits(result.outputAmount, usdh.decimals)
        );
        const inputAmount = parseFloat(
          ethers.utils.formatUnits(result.inputAmount, usdc.decimals)
        );
        const calculatedPrice = inputAmount / outputAmount;

        expect(Math.abs(calculatedPrice - avgPrice)).toBeLessThan(0.00001);
      });

      test("should calculate slippage correctly for buying (higher price = worse)", async () => {
        const twoLevelOrderBook: MockOrderBookData = {
          coin: "@230",
          time: 1760575824177,
          levels: [
            [
              {
                px: "1.0",
                sz: "1000.0",
                n: 1,
              },
            ],
            [
              {
                px: "1.0",
                sz: "1000.0",
                n: 1,
              },
              {
                px: "1.01",
                sz: "1000.0",
                n: 1,
              },
            ],
          ],
        };

        mockedAxios.post.mockResolvedValue({ data: twoLevelOrderBook });

        const result = await simulateMarketOrder({
          tokenIn: usdc,
          tokenOut: usdh,
          amount: ethers.utils.parseUnits("1500", usdc.decimals),
          amountType: "input",
        });

        // Should consume both levels
        expect(result.levelsConsumed).toBe(2);

        // Average price should be between 1.0 and 1.01
        const avgPrice = parseFloat(result.averageExecutionPrice);
        expect(avgPrice).toBeGreaterThan(1.0);
        expect(avgPrice).toBeLessThan(1.01);

        // Slippage should be positive (worse than best price)
        expect(result.slippagePercent).toBeGreaterThan(0);
        expect(result.slippagePercent).toBeLessThan(1);
      });

      test("should calculate slippage correctly for selling (lower price = worse)", async () => {
        const twoLevelOrderBook: MockOrderBookData = {
          coin: "@230",
          time: 1760575824177,
          levels: [
            [
              {
                px: "1.0",
                sz: "1000.0",
                n: 1,
              },
              {
                px: "0.99",
                sz: "1000.0",
                n: 1,
              },
            ],
            [
              {
                px: "1.01",
                sz: "1000.0",
                n: 1,
              },
            ],
          ],
        };

        mockedAxios.post.mockResolvedValue({ data: twoLevelOrderBook });

        const result = await simulateMarketOrder({
          tokenIn: usdh,
          tokenOut: usdc,
          amount: ethers.utils.parseUnits("1500", usdh.decimals),
          amountType: "input",
        });

        // Should consume both levels
        expect(result.levelsConsumed).toBe(2);

        // Average price should be between 0.99 and 1.0
        const avgPrice = parseFloat(result.averageExecutionPrice);
        expect(avgPrice).toBeGreaterThan(0.99);
        expect(avgPrice).toBeLessThan(1.0);

        // Slippage should be positive (worse than best price)
        expect(result.slippagePercent).toBeGreaterThan(0);
        expect(result.slippagePercent).toBeLessThan(1);
      });
    });

    describe("amountType: output", () => {
      test("should calculate required USDC input to receive desired USDH output", async () => {
        mockedAxios.post.mockResolvedValue({ data: mockOrderBookData });

        const desiredOutput = ethers.utils.parseUnits("1000", usdh.decimals);
        const result = await simulateMarketOrder({
          tokenIn: usdc,
          tokenOut: usdh,
          amount: desiredOutput,
          amountType: "output",
        });

        // At best price of 0.99983, to get 1000 USDH we need approximately 999.83 USDC
        expect(result.fullyFilled).toBe(true);
        expect(result.levelsConsumed).toBe(1);
        expect(result.bestPrice).toBe("0.99983");

        // Output should match requested amount
        expect(result.outputAmount.toString()).toBe(desiredOutput.toString());

        // Input should be close to 1000 * 0.99983 ≈ 999.83
        const inputAmount = parseFloat(
          ethers.utils.formatUnits(result.inputAmount, usdc.decimals)
        );
        expect(inputAmount).toBeGreaterThan(999);
        expect(inputAmount).toBeLessThan(1001);
      });

      test("should calculate required USDH input to receive desired USDC output", async () => {
        mockedAxios.post.mockResolvedValue({ data: mockOrderBookData });

        const desiredOutput = ethers.utils.parseUnits("1000", usdc.decimals);
        const result = await simulateMarketOrder({
          tokenIn: usdh,
          tokenOut: usdc,
          amount: desiredOutput,
          amountType: "output",
        });

        // To get 1000 USDC by selling USDH at price 0.99979, need ~1000.21 USDH
        expect(result.fullyFilled).toBe(true);
        expect(result.levelsConsumed).toBe(1);
        expect(result.bestPrice).toBe("0.99979");

        // Output should match requested amount
        expect(result.outputAmount.toString()).toBe(desiredOutput.toString());

        // Input should be slightly more than 1000
        const inputAmount = parseFloat(
          ethers.utils.formatUnits(result.inputAmount, usdh.decimals)
        );
        expect(inputAmount).toBeGreaterThan(1000);
        expect(inputAmount).toBeLessThan(1001);
      });

      test("should handle large output orders consuming multiple levels", async () => {
        mockedAxios.post.mockResolvedValue({ data: mockOrderBookData });

        const result = await simulateMarketOrder({
          tokenIn: usdc,
          tokenOut: usdh,
          amount: ethers.utils.parseUnits("50000", usdh.decimals),
          amountType: "output",
        });

        expect(result.fullyFilled).toBe(true);
        expect(result.levelsConsumed).toBeGreaterThan(1);

        // Output should match requested amount
        const outputAmount = parseFloat(
          ethers.utils.formatUnits(result.outputAmount, usdh.decimals)
        );
        expect(outputAmount).toBeCloseTo(50000, 0);

        // Slippage should be higher for larger orders
        expect(result.slippagePercent).toBeGreaterThan(0);
      });

      test("should handle partial fills when desired output exceeds available liquidity", async () => {
        const limitedLiquidityOrderBook: MockOrderBookData = {
          coin: "@230",
          time: 1760575824177,
          levels: [
            [
              {
                px: "0.99979",
                sz: "1000.0",
                n: 1,
              },
            ],
            [
              {
                px: "0.99983",
                sz: "1000.0",
                n: 1,
              },
            ],
          ],
        };

        mockedAxios.post.mockResolvedValue({ data: limitedLiquidityOrderBook });

        const result = await simulateMarketOrder({
          tokenIn: usdc,
          tokenOut: usdh,
          amount: ethers.utils.parseUnits("2000", usdh.decimals),
          amountType: "output",
        });

        // Should only partially fill since only 1000 USDH available
        expect(result.fullyFilled).toBe(false);

        // Should have received only the available liquidity
        const outputReceived = parseFloat(
          ethers.utils.formatUnits(result.outputAmount, usdh.decimals)
        );
        expect(outputReceived).toBeLessThan(2000);
        expect(outputReceived).toBeCloseTo(1000, 0);
      });

      test("input and output amount types should be consistent for same trade", async () => {
        mockedAxios.post.mockResolvedValue({ data: mockOrderBookData });

        // First, simulate with input amount type
        const inputResult = await simulateMarketOrder({
          tokenIn: usdc,
          tokenOut: usdh,
          amount: ethers.utils.parseUnits("1000", usdc.decimals),
          amountType: "input",
        });

        // Then, simulate with output amount type using the output from first simulation
        const outputResult = await simulateMarketOrder({
          tokenIn: usdc,
          tokenOut: usdh,
          amount: inputResult.outputAmount,
          amountType: "output",
        });

        // The required input should match the original input (within rounding)
        const inputFromInputType = parseFloat(
          ethers.utils.formatUnits(inputResult.inputAmount, usdc.decimals)
        );
        const inputFromOutputType = parseFloat(
          ethers.utils.formatUnits(outputResult.inputAmount, usdc.decimals)
        );

        expect(inputFromOutputType).toBeCloseTo(inputFromInputType, 2);
      });
    });

    describe("error cases", () => {
      test("should throw error for unsupported token pair", async () => {
        // Don't mock axios - let it fail naturally when the pair isn't found
        await expect(
          simulateMarketOrder({
            tokenIn: {
              symbol: "BTC",
              decimals: 8,
            },
            tokenOut: {
              symbol: "ETH",
              decimals: 18,
            },
            amount: ethers.utils.parseUnits("1", 8),
            amountType: "input",
          })
        ).rejects.toThrow("No L2 order book coin found for pair BTC/ETH");
      });

      test("should throw error when order book has no liquidity", async () => {
        const emptyOrderBook: MockOrderBookData = {
          coin: "@230",
          time: 1760575824177,
          levels: [[], []],
        };

        mockedAxios.post.mockResolvedValue({ data: emptyOrderBook });

        await expect(
          simulateMarketOrder({
            tokenIn: usdc,
            tokenOut: usdh,
            amount: ethers.utils.parseUnits("1000", usdc.decimals),
            amountType: "input",
          })
        ).rejects.toThrow("No liquidity available for USDC/USDH");
      });
    });
  });

  describe("#isHyperEvmToHyperCoreRoute()", () => {
    test("should return true for HyperEVM -> HyperCore", () => {
      const params = {
        inputToken: {
          ...TOKEN_SYMBOLS_MAP.USDC,
          address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.HYPEREVM],
          chainId: CHAIN_IDs.HYPEREVM,
        },
        outputToken: {
          ...TOKEN_SYMBOLS_MAP.USDC,
          address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.HYPERCORE],
          chainId: CHAIN_IDs.HYPERCORE,
        },
      };
      const isRouteSupported = isHyperEvmToHyperCoreRoute(params);
      expect(isRouteSupported).toEqual(true);
    });

    test("should return true for HyperEVM Testnet -> HyperCore Testnet", () => {
      const params = {
        inputToken: {
          ...TOKEN_SYMBOLS_MAP.USDC,
          address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.HYPEREVM_TESTNET],
          chainId: CHAIN_IDs.HYPEREVM_TESTNET,
        },
        outputToken: {
          ...TOKEN_SYMBOLS_MAP.USDC,
          address:
            TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.HYPERCORE_TESTNET],
          chainId: CHAIN_IDs.HYPERCORE_TESTNET,
        },
      };
      const isRouteSupported = isHyperEvmToHyperCoreRoute(params);
      expect(isRouteSupported).toEqual(true);
    });

    test("should return false for HyperCore -> HyperEVM", () => {
      const params = {
        inputToken: {
          ...TOKEN_SYMBOLS_MAP.USDC,
          address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.HYPERCORE],
          chainId: CHAIN_IDs.HYPERCORE,
        },
        outputToken: {
          ...TOKEN_SYMBOLS_MAP.USDC,
          address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.HYPEREVM],
          chainId: CHAIN_IDs.HYPEREVM,
        },
      };
      const isRouteSupported = isHyperEvmToHyperCoreRoute(params);
      expect(isRouteSupported).toEqual(false);
    });
  });

  describe("#assertAccountExistsOnHyperCore()", () => {
    const mockProvider = (exists: boolean) => {
      const encodedResult = ethers.utils.defaultAbiCoder.encode(
        ["bool"],
        [exists]
      );
      return {
        call: jest.fn().mockResolvedValue(encodedResult),
      };
    };

    test("should throw error if account does not exist on HyperCore", async () => {
      mockedGetProvider.mockReturnValue(mockProvider(false) as any);

      await expect(
        assertAccountExistsOnHyperCore({
          account: "0x1234567890123456789012345678901234567890",
          chainId: CHAIN_IDs.HYPERCORE,
        })
      ).rejects.toThrow(HypercoreAccountNotInitializedError);

      expect(mockedGetProvider).toHaveBeenCalledWith(CHAIN_IDs.HYPEREVM);
    });

    test("should not throw error if account exists on HyperCore", async () => {
      mockedGetProvider.mockReturnValue(mockProvider(true) as any);

      await expect(
        assertAccountExistsOnHyperCore({
          account: "0x1234567890123456789012345678901234567890",
          chainId: CHAIN_IDs.HYPERCORE,
        })
      ).resolves.not.toThrow(HypercoreAccountNotInitializedError);

      expect(mockedGetProvider).toHaveBeenCalledWith(CHAIN_IDs.HYPEREVM);
    });
  });
});
