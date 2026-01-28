import { describe, expect, it } from "vitest";

import {
  SUPPORTED_INPUT_TOKENS,
  SUPPORTED_ORIGIN_CHAINS,
} from "../../../../api/_bridges/hypercore-intent/utils/constants";

describe("hypercore-intent constants", () => {
  describe("SUPPORTED_INPUT_TOKENS", () => {
    it("should include USDC and USDT", () => {
      const symbols = SUPPORTED_INPUT_TOKENS.map((t) => t.symbol);
      expect(symbols).toContain("USDC");
      expect(symbols).toContain("USDT");
      expect(symbols).toHaveLength(2);
    });
  });

  describe("SUPPORTED_ORIGIN_CHAINS", () => {
    it("should include chains that have at least one supported input token", () => {
      // Every chain in SUPPORTED_ORIGIN_CHAINS must have at least one supported input token
      SUPPORTED_ORIGIN_CHAINS.forEach((chainId) => {
        const hasAtLeastOneToken = SUPPORTED_INPUT_TOKENS.some(
          (token) => token.addresses[chainId]
        );
        expect(hasAtLeastOneToken).toBe(true);
      });
    });
  });
});
