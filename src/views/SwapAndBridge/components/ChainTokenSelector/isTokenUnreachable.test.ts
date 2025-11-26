import { isTokenUnreachable } from "./isTokenUnreachable";
import { EnrichedToken } from "./ChainTokenSelectorModal";
import { CHAIN_IDs } from "../../../../utils/constants";

describe("isTokenUnreachable", () => {
  describe("same chain check", () => {
    it("should mark token as unreachable if it's from the same chain as otherToken", () => {
      const otherToken = {
        chainId: CHAIN_IDs.MAINNET,
        symbol: "USDC",
      } as EnrichedToken;

      const token = {
        chainId: CHAIN_IDs.MAINNET,
        symbol: "USDT",
      } as EnrichedToken;

      const isUnreachable = isTokenUnreachable(token, true, otherToken);

      expect(isUnreachable).toBe(true);
    });

    it("should not mark token as unreachable if it's from a different chain", () => {
      const otherToken = {
        chainId: CHAIN_IDs.MAINNET,
        symbol: "USDC",
      } as EnrichedToken;

      const token = {
        chainId: CHAIN_IDs.ARBITRUM,
        symbol: "USDC",
      } as EnrichedToken;

      const isUnreachable = isTokenUnreachable(token, true, otherToken);

      expect(isUnreachable).toBe(false);
    });
  });

  describe("restricted origin chains check", () => {
    it("should mark token as unreachable if origin chain is restricted for destination", () => {
      // Selecting origin token, destination is Hypercore
      const destinationToken = {
        chainId: CHAIN_IDs.HYPERCORE,
        symbol: "USDH-SPOT",
      } as EnrichedToken;

      // BSC is restricted as origin to Hypercore
      const originToken = {
        chainId: CHAIN_IDs.BSC,
        symbol: "USDC",
      } as EnrichedToken;

      const isUnreachable = isTokenUnreachable(
        originToken,
        true,
        destinationToken
      );

      expect(isUnreachable).toBe(true);
    });

    it("should not mark token as unreachable if origin chain is allowed for destination", () => {
      // Selecting origin token, destination is Hypercore
      const destinationToken = {
        chainId: CHAIN_IDs.HYPERCORE,
        symbol: "USDH-SPOT",
      } as EnrichedToken;

      // Mainnet is not restricted
      const originToken = {
        chainId: CHAIN_IDs.MAINNET,
        symbol: "USDC",
      } as EnrichedToken;

      const isUnreachable = isTokenUnreachable(
        originToken,
        true,
        destinationToken
      );

      expect(isUnreachable).toBe(false);
    });
  });
});
