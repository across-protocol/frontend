import { describe, expect, it } from "vitest";
import { getAcrossBridgeStrategy } from "../../../../api/_bridges/across/strategy";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../../../api/_constants";

describe("getAcrossBridgeStrategy", () => {
  const strategy = getAcrossBridgeStrategy();

  describe("resolveOriginSwapTarget", () => {
    it("should resolve bridgeable token for valid route", () => {
      const result = strategy.resolveOriginSwapTarget!({
        inputToken: {
          symbol: "WETH",
          chainId: CHAIN_IDs.ARBITRUM,
          address: TOKEN_SYMBOLS_MAP.WETH.addresses[CHAIN_IDs.ARBITRUM],
          decimals: 18,
        },
        outputToken: {
          symbol: "USDC",
          chainId: CHAIN_IDs.OPTIMISM,
          address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.OPTIMISM],
          decimals: 6,
        },
      });

      expect(result).toBeDefined();
      expect(result!.symbol).toBe("USDC");
      expect(result!.chainId).toBe(CHAIN_IDs.ARBITRUM);
      expect(result!.address).toBe(
        TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.ARBITRUM]
      );
      expect(result!.decimals).toBe(6);
    });

    it("should resolve WETH for WETH destination on different chain", () => {
      const result = strategy.resolveOriginSwapTarget!({
        inputToken: {
          symbol: "USDC",
          chainId: CHAIN_IDs.ARBITRUM,
          address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.ARBITRUM],
          decimals: 6,
        },
        outputToken: {
          symbol: "WETH",
          chainId: CHAIN_IDs.OPTIMISM,
          address: TOKEN_SYMBOLS_MAP.WETH.addresses[CHAIN_IDs.OPTIMISM],
          decimals: 18,
        },
      });

      expect(result).toBeDefined();
      expect(result!.symbol).toBe("WETH");
      expect(result!.chainId).toBe(CHAIN_IDs.ARBITRUM);
    });

    it("should return undefined for unsupported route", () => {
      const result = strategy.resolveOriginSwapTarget!({
        inputToken: {
          symbol: "WETH",
          chainId: CHAIN_IDs.ARBITRUM,
          address: TOKEN_SYMBOLS_MAP.WETH.addresses[CHAIN_IDs.ARBITRUM],
          decimals: 18,
        },
        outputToken: {
          symbol: "UNKNOWN",
          chainId: 999999,
          address: "0xabcdef1234567890",
          decimals: 18,
        },
      });

      expect(result).toBeUndefined();
    });

    it("should return undefined if token not found", () => {
      const result = strategy.resolveOriginSwapTarget!({
        inputToken: {
          symbol: "WETH",
          chainId: CHAIN_IDs.ARBITRUM,
          address: TOKEN_SYMBOLS_MAP.WETH.addresses[CHAIN_IDs.ARBITRUM],
          decimals: 18,
        },
        outputToken: {
          symbol: "NONEXISTENT",
          chainId: CHAIN_IDs.OPTIMISM,
          address: "0x0000000000000000000000000000000000000000",
          decimals: 18,
        },
      });

      expect(result).toBeUndefined();
    });
  });
});
