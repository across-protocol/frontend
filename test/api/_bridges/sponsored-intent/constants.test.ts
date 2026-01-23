import { describe, expect, it } from "vitest";

import {
  SUPPORTED_INPUT_TOKENS,
  SUPPORTED_ORIGIN_CHAINS,
} from "../../../../api/_bridges/sponsored-intent/utils/constants";
import { CHAIN_IDs } from "../../../../api/_constants";

describe("sponsored-intent constants", () => {
  describe("SUPPORTED_INPUT_TOKENS", () => {
    it("should include USDC, USDC-BNB, USDC.e, and USDzC", () => {
      const symbols = SUPPORTED_INPUT_TOKENS.map((t) => t.symbol);
      expect(symbols).toContain("USDC");
      expect(symbols).toContain("USDC-BNB");
      expect(symbols).toContain("USDC.e");
      expect(symbols).toContain("USDzC");
    });
  });

  describe("SUPPORTED_ORIGIN_CHAINS", () => {
    it("should include non-CCTP chains that have supported USDC variants", () => {
      // Non-CCTP chains with USDC.e
      expect(SUPPORTED_ORIGIN_CHAINS).toContain(CHAIN_IDs.ZK_SYNC);
      expect(SUPPORTED_ORIGIN_CHAINS).toContain(CHAIN_IDs.MODE);
      expect(SUPPORTED_ORIGIN_CHAINS).toContain(CHAIN_IDs.LISK);
      expect(SUPPORTED_ORIGIN_CHAINS).toContain(CHAIN_IDs.SONEIUM);

      // Non-CCTP chains with USDzC
      expect(SUPPORTED_ORIGIN_CHAINS).toContain(CHAIN_IDs.ZORA);

      // Non-CCTP chains with native USDC
      expect(SUPPORTED_ORIGIN_CHAINS).toContain(CHAIN_IDs.SCROLL);
      expect(SUPPORTED_ORIGIN_CHAINS).toContain(CHAIN_IDs.LENS);

      // Non-CCTP chain with USDC-BNB
      expect(SUPPORTED_ORIGIN_CHAINS).toContain(CHAIN_IDs.BSC);
    });

    it("should include CCTP chains that have native USDC", () => {
      expect(SUPPORTED_ORIGIN_CHAINS).toContain(CHAIN_IDs.OPTIMISM);
      expect(SUPPORTED_ORIGIN_CHAINS).toContain(CHAIN_IDs.ARBITRUM);
      expect(SUPPORTED_ORIGIN_CHAINS).toContain(CHAIN_IDs.BASE);
    });

    it("should derive chains from SUPPORTED_INPUT_TOKENS addresses", () => {
      // Every chain in SUPPORTED_ORIGIN_CHAINS should have at least one
      // supported input token with an address on that chain
      SUPPORTED_ORIGIN_CHAINS.forEach((chainId) => {
        const hasToken = SUPPORTED_INPUT_TOKENS.some(
          (token) => token.addresses[chainId]
        );
        expect(hasToken).toBe(true);
      });
    });
  });
});
