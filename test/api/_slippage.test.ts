import {
  getSlippage,
  validateDestinationSwapSlippage,
  STABLE_COIN_SWAP_SLIPPAGE,
  MAJOR_PAIR_SLIPPAGE,
  LONG_TAIL_SLIPPAGE,
} from "../../api/_slippage";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../api/_constants";
import { SwapSlippageInsufficientError } from "../../api/_errors";

describe("api/_slippage", () => {
  const wethMainnet = {
    ...TOKEN_SYMBOLS_MAP.WETH,
    address: TOKEN_SYMBOLS_MAP.WETH.addresses[CHAIN_IDs.MAINNET],
    chainId: CHAIN_IDs.MAINNET,
  };
  const usdcMainnet = {
    ...TOKEN_SYMBOLS_MAP.USDC,
    address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.MAINNET],
    chainId: CHAIN_IDs.MAINNET,
  };
  const usdtMainnet = {
    ...TOKEN_SYMBOLS_MAP.USDT,
    address: TOKEN_SYMBOLS_MAP.USDT.addresses[CHAIN_IDs.MAINNET],
    chainId: CHAIN_IDs.MAINNET,
  };
  const pepeMainnet = {
    symbol: "PEPE",
    address: "0x4dFae3690b93c47470b03036A17B23C1Be05127C",
    chainId: CHAIN_IDs.MAINNET,
    decimals: 18,
  };

  describe("#getSlippage()", () => {
    test("should return the provided slippage tolerance", () => {
      const result = getSlippage({
        tokenIn: wethMainnet,
        tokenOut: usdcMainnet,
        slippageTolerance: 2.5,
        originOrDestination: "origin",
      });
      expect(result).toBe(2.5);
    });

    test("should return the provided slippage tolerance with 2 decimals", () => {
      const result = getSlippage({
        tokenIn: wethMainnet,
        tokenOut: usdcMainnet,
        slippageTolerance: 2.5123456789,
        originOrDestination: "origin",
      });
      expect(result).toBe(2.51);
    });

    test("should return the provided slippage tolerance with 2 decimals", () => {
      const result = getSlippage({
        tokenIn: wethMainnet,
        tokenOut: usdcMainnet,
        slippageTolerance: 2,
        splitSlippage: true,
        originOrDestination: "origin",
      });
      expect(result).toBe(1);
    });

    test("should throw an error when the slippage tolerance is invalid", () => {
      expect(() =>
        getSlippage({
          tokenIn: wethMainnet,
          tokenOut: usdcMainnet,
          slippageTolerance: -0.5,
          originOrDestination: "origin",
        })
      ).toThrow("Slippage tolerance value is less than 0%");
    });

    test("should throw an error when the slippage tolerance exceeds 100%", () => {
      expect(() =>
        getSlippage({
          tokenIn: wethMainnet,
          tokenOut: usdcMainnet,
          slippageTolerance: 100.5,
          originOrDestination: "origin",
        })
      ).toThrow("Slippage tolerance value exceeds 100%");
    });

    test("should return the auto slippage value for stable coin pair", () => {
      const resultOrigin = getSlippage({
        tokenIn: usdcMainnet,
        tokenOut: usdtMainnet,
        slippageTolerance: "auto",
        originOrDestination: "origin",
      });
      const resultDestination = getSlippage({
        tokenIn: usdcMainnet,
        tokenOut: usdtMainnet,
        slippageTolerance: "auto",
        originOrDestination: "destination",
      });
      expect(resultOrigin).toBe(STABLE_COIN_SWAP_SLIPPAGE.origin);
      expect(resultDestination).toBe(STABLE_COIN_SWAP_SLIPPAGE.destination);
    });

    test("should return the auto slippage value for major pair", () => {
      const resultOrigin = getSlippage({
        tokenIn: wethMainnet,
        tokenOut: usdtMainnet,
        slippageTolerance: "auto",
        originOrDestination: "origin",
      });
      const resultDestination = getSlippage({
        tokenIn: wethMainnet,
        tokenOut: usdtMainnet,
        slippageTolerance: "auto",
        originOrDestination: "destination",
      });
      expect(resultOrigin).toBe(MAJOR_PAIR_SLIPPAGE.origin);
      expect(resultDestination).toBe(MAJOR_PAIR_SLIPPAGE.destination);
    });

    test("should return the auto slippage value for long tail + major pair", () => {
      const resultOrigin = getSlippage({
        tokenIn: pepeMainnet,
        tokenOut: wethMainnet,
        slippageTolerance: "auto",
        originOrDestination: "origin",
      });
      const resultDestination = getSlippage({
        tokenIn: pepeMainnet,
        tokenOut: wethMainnet,
        slippageTolerance: "auto",
        originOrDestination: "destination",
      });
      expect(resultOrigin).toBe(LONG_TAIL_SLIPPAGE.origin);
      expect(resultDestination).toBe(LONG_TAIL_SLIPPAGE.destination);
    });

    test("should return the auto slippage value for long tail + stable pair", () => {
      const resultOrigin = getSlippage({
        tokenIn: pepeMainnet,
        tokenOut: usdcMainnet,
        slippageTolerance: "auto",
        originOrDestination: "origin",
      });
      const resultDestination = getSlippage({
        tokenIn: pepeMainnet,
        tokenOut: usdcMainnet,
        slippageTolerance: "auto",
        originOrDestination: "destination",
      });
      expect(resultOrigin).toBe(LONG_TAIL_SLIPPAGE.origin);
      expect(resultDestination).toBe(LONG_TAIL_SLIPPAGE.destination);
    });

    test("should throw an error when tokens are on different chains", () => {
      expect(() =>
        getSlippage({
          tokenIn: wethMainnet,
          tokenOut: {
            ...TOKEN_SYMBOLS_MAP.USDC,
            address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.OPTIMISM],
            chainId: CHAIN_IDs.OPTIMISM,
          },
          slippageTolerance: "auto",
          originOrDestination: "origin",
        })
      ).toThrow("Can't resolve auto slippage for tokens on different chains");
    });
  });

  describe("#validateDestinationSwapSlippage()", () => {
    test("should not throw when slippage is 'auto'", () => {
      expect(() =>
        validateDestinationSwapSlippage({
          tokenIn: usdcMainnet,
          tokenOut: usdtMainnet,
          slippageTolerance: "auto",
          splitSlippage: false,
        })
      ).not.toThrow();
    });

    test("should not throw when user slippage equals auto slippage", () => {
      // Stable coin pair destination slippage = 0.5%
      expect(() =>
        validateDestinationSwapSlippage({
          tokenIn: usdcMainnet,
          tokenOut: usdtMainnet,
          slippageTolerance: STABLE_COIN_SWAP_SLIPPAGE.destination,
          splitSlippage: false,
        })
      ).not.toThrow();
    });

    test("should not throw when user slippage is greater than auto slippage", () => {
      // Stable coin pair destination slippage = 0.5%, user provides 1.0%
      expect(() =>
        validateDestinationSwapSlippage({
          tokenIn: usdcMainnet,
          tokenOut: usdtMainnet,
          slippageTolerance: 1.0,
          splitSlippage: false,
        })
      ).not.toThrow();
    });

    test("should throw SwapSlippageInsufficientError when user slippage < auto for stable coins", () => {
      // Stable coin pair destination slippage = 0.5%, user provides 0.3%
      expect(() =>
        validateDestinationSwapSlippage({
          tokenIn: usdcMainnet,
          tokenOut: usdtMainnet,
          slippageTolerance: 0.3,
          splitSlippage: false,
        })
      ).toThrow(SwapSlippageInsufficientError);
    });

    test("should throw SwapSlippageInsufficientError when user slippage < auto for major pair", () => {
      // Major pair (WETH/USDC) destination slippage = 1.5%, user provides 1.0%
      expect(() =>
        validateDestinationSwapSlippage({
          tokenIn: wethMainnet,
          tokenOut: usdcMainnet,
          slippageTolerance: 1.0,
          splitSlippage: false,
        })
      ).toThrow(SwapSlippageInsufficientError);
    });

    test("should throw SwapSlippageInsufficientError when user slippage < auto for long tail pair", () => {
      // Long tail pair (PEPE/USDC) destination slippage = 5.0%, user provides 3.0%
      expect(() =>
        validateDestinationSwapSlippage({
          tokenIn: usdcMainnet,
          tokenOut: pepeMainnet,
          slippageTolerance: 3.0,
          splitSlippage: false,
        })
      ).toThrow(SwapSlippageInsufficientError);
    });

    test("should account for split slippage in validation", () => {
      // User provides 2.0% with splitSlippage: true
      // Effective slippage = 1.0%
      // Major pair auto = 1.5%, so should throw
      expect(() =>
        validateDestinationSwapSlippage({
          tokenIn: wethMainnet,
          tokenOut: usdcMainnet,
          slippageTolerance: 2.0,
          splitSlippage: true,
        })
      ).toThrow(SwapSlippageInsufficientError);
    });

    test("should pass validation with split slippage when sufficient", () => {
      // User provides 4.0% with splitSlippage: true
      // Effective slippage = 2.0% (4.0% / 2)
      // Major pair auto = 1.5%, so should pass
      expect(() =>
        validateDestinationSwapSlippage({
          tokenIn: wethMainnet,
          tokenOut: usdcMainnet,
          slippageTolerance: 4.0,
          splitSlippage: true,
        })
      ).not.toThrow();
    });
  });
});
