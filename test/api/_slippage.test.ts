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
      });
      expect(result).toBe(2.5);
    });

    test("should return the provided slippage tolerance with 2 decimals", () => {
      const result = getSlippage({
        tokenIn: wethMainnet,
        tokenOut: usdcMainnet,
        slippageTolerance: 2.5123456789,
      });
      expect(result).toBe(2.51);
    });

    test("should throw an error when the slippage tolerance is invalid", () => {
      expect(() =>
        getSlippage({
          tokenIn: wethMainnet,
          tokenOut: usdcMainnet,
          slippageTolerance: -0.5,
        })
      ).toThrow("Slippage tolerance value is less than 0%");
    });

    test("should throw an error when the slippage tolerance exceeds 100%", () => {
      expect(() =>
        getSlippage({
          tokenIn: wethMainnet,
          tokenOut: usdcMainnet,
          slippageTolerance: 100.5,
        })
      ).toThrow("Slippage tolerance value exceeds 100%");
    });

    test("should return the auto slippage value for stable coin pair", () => {
      const result = getSlippage({
        tokenIn: usdcMainnet,
        tokenOut: usdtMainnet,
        slippageTolerance: "auto",
      });
      expect(result).toBe(STABLE_COIN_SWAP_SLIPPAGE);
    });

    test("should return the auto slippage value for major pair", () => {
      const result = getSlippage({
        tokenIn: wethMainnet,
        tokenOut: usdtMainnet,
        slippageTolerance: "auto",
      });
      expect(result).toBe(MAJOR_PAIR_SLIPPAGE);
    });

    test("should return the auto slippage value for long tail + major pair", () => {
      const result = getSlippage({
        tokenIn: pepeMainnet,
        tokenOut: wethMainnet,
        slippageTolerance: "auto",
      });
      expect(result).toBe(LONG_TAIL_SLIPPAGE);
    });

    test("should return the auto slippage value for long tail + stable pair", () => {
      const result = getSlippage({
        tokenIn: pepeMainnet,
        tokenOut: usdcMainnet,
        slippageTolerance: "auto",
      });
      expect(result).toBe(LONG_TAIL_SLIPPAGE);
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
        })
      ).toThrow("Can't resolve auto slippage for tokens on different chains");
    });
  });
});
