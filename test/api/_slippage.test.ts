import {
  getSlippage,
  STABLE_COIN_SWAP_SLIPPAGE,
  MAJOR_PAIR_SLIPPAGE,
  LONG_TAIL_SLIPPAGE,
} from "../../api/_slippage";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../api/_constants";

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
});
