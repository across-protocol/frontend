import { describe, expect, it } from "vitest";

import {
  SUPPORTED_INPUT_TOKENS,
  SUPPORTED_ORIGIN_CHAINS,
} from "../../../../api/_bridges/hypercore-intent/utils/constants";

describe("hypercore-intent constants", () => {
  describe("SUPPORTED_INPUT_TOKENS", () => {
    it("should include USDC, USDC-BNB, USDC.e, and USDzC", () => {
      const symbols = SUPPORTED_INPUT_TOKENS.map((t) => t.symbol);
      expect(symbols).toContain("USDC");
    });
  });

  describe("SUPPORTED_ORIGIN_CHAINS", () => {
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
