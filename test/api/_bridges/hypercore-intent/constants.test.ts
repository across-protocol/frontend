import { describe, expect, it } from "vitest";

import {
  SUPPORTED_INPUT_TOKENS,
  SUPPORTED_ORIGIN_CHAINS,
} from "../../../../api/_bridges/hypercore-intent/utils/constants";
import { CHAINS, CCTP_NO_DOMAIN } from "../../../../api/_constants";

describe("hypercore-intent constants", () => {
  describe("SUPPORTED_INPUT_TOKENS", () => {
    it("should include only USDC", () => {
      const symbols = SUPPORTED_INPUT_TOKENS.map((t) => t.symbol);
      expect(symbols).toContain("USDC");
      expect(symbols).toHaveLength(1);
    });
  });

  describe("SUPPORTED_ORIGIN_CHAINS", () => {
    it("should only include CCTP-enabled chains", () => {
      // Every chain in SUPPORTED_ORIGIN_CHAINS must have a valid CCTP domain
      SUPPORTED_ORIGIN_CHAINS.forEach((chainId) => {
        const chain = CHAINS[chainId];
        const cctpDomain = chain?.cctpDomain;
        expect(cctpDomain).toBeDefined();
        expect(cctpDomain).not.toBe(CCTP_NO_DOMAIN);
      });
    });
  });
});
