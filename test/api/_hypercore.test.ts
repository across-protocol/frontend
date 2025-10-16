import { ethers } from "ethers";
import axios from "axios";

import {
  getL2OrderBookForPair,
  simulateMarketOrder,
} from "../../api/_hypercore";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

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

    test("should simulate buying USDH with USDC (small order)", async () => {
      mockedAxios.post.mockResolvedValue({ data: mockOrderBookData });

      const result = await simulateMarketOrder({
        tokenIn: usdc,
        tokenOut: usdh,
        inputAmount: ethers.utils.parseUnits("1000", usdc.decimals),
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
        inputAmount: ethers.utils.parseUnits("100000", usdc.decimals),
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
        inputAmount: ethers.utils.parseUnits("1000", usdh.decimals),
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
        inputAmount: ethers.utils.parseUnits("2000", usdc.decimals),
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
        inputAmount: ethers.utils.parseUnits("50000", usdc.decimals),
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
          inputAmount: ethers.utils.parseUnits("1", 8),
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
          inputAmount: ethers.utils.parseUnits("1000", usdc.decimals),
        })
      ).rejects.toThrow("No liquidity available for USDC/USDH");
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
        inputAmount: ethers.utils.parseUnits("1500", usdc.decimals),
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
        inputAmount: ethers.utils.parseUnits("1500", usdh.decimals),
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
});
