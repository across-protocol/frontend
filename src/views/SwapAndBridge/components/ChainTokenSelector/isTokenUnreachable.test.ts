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

      const predicate = isTokenUnreachable(true, otherToken);
      expect(predicate(token)).toBe(true);
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

      const predicate = isTokenUnreachable(true, otherToken);
      expect(predicate(token)).toBe(false);
    });

    it("should return false when otherToken is null", () => {
      const token = {
        chainId: CHAIN_IDs.MAINNET,
        symbol: "USDC",
      } as EnrichedToken;

      const predicate = isTokenUnreachable(true, null);
      expect(predicate(token)).toBe(false);
    });
  });

  describe("restricted origin chains check", () => {
    describe("when selecting origin token (isOriginToken = true)", () => {
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

        const predicate = isTokenUnreachable(true, destinationToken);
        expect(predicate(originToken)).toBe(true);
      });

      it("should mark Lisk as unreachable when destination is Hypercore", () => {
        const destinationToken = {
          chainId: CHAIN_IDs.HYPERCORE,
          symbol: "USDH-SPOT",
        } as EnrichedToken;

        const originToken = {
          chainId: CHAIN_IDs.LISK,
          symbol: "USDC",
        } as EnrichedToken;

        const predicate = isTokenUnreachable(true, destinationToken);
        expect(predicate(originToken)).toBe(true);
      });

      it("should mark HyperEVM as unreachable when destination is Hypercore", () => {
        const destinationToken = {
          chainId: CHAIN_IDs.HYPERCORE,
          symbol: "USDH-SPOT",
        } as EnrichedToken;

        const originToken = {
          chainId: CHAIN_IDs.HYPEREVM,
          symbol: "USDC",
        } as EnrichedToken;

        const predicate = isTokenUnreachable(true, destinationToken);
        expect(predicate(originToken)).toBe(true);
      });

      it("should not mark allowed origin chains as unreachable", () => {
        const destinationToken = {
          chainId: CHAIN_IDs.HYPERCORE,
          symbol: "USDH-SPOT",
        } as EnrichedToken;

        // Mainnet is not restricted
        const originToken = {
          chainId: CHAIN_IDs.MAINNET,
          symbol: "USDC",
        } as EnrichedToken;

        const predicate = isTokenUnreachable(true, destinationToken);
        expect(predicate(originToken)).toBe(false);
      });
    });

    describe("when selecting destination token (isOriginToken = false)", () => {
      it("should mark Hypercore as unreachable if origin is restricted", () => {
        // Selecting destination token, origin is BSC
        const originToken = {
          chainId: CHAIN_IDs.BSC,
          symbol: "USDC",
        } as EnrichedToken;

        // Hypercore is restricted from BSC origin
        const destinationToken = {
          chainId: CHAIN_IDs.HYPERCORE,
          symbol: "USDH-SPOT",
        } as EnrichedToken;

        const predicate = isTokenUnreachable(false, originToken);
        expect(predicate(destinationToken)).toBe(true);
      });

      it("should mark Hypercore as unreachable when origin is Lisk", () => {
        const originToken = {
          chainId: CHAIN_IDs.LISK,
          symbol: "USDC",
        } as EnrichedToken;

        const destinationToken = {
          chainId: CHAIN_IDs.HYPERCORE,
          symbol: "USDH-SPOT",
        } as EnrichedToken;

        const predicate = isTokenUnreachable(false, originToken);
        expect(predicate(destinationToken)).toBe(true);
      });

      it("should mark Hypercore as unreachable when origin is HyperEVM", () => {
        const originToken = {
          chainId: CHAIN_IDs.HYPEREVM,
          symbol: "USDC",
        } as EnrichedToken;

        const destinationToken = {
          chainId: CHAIN_IDs.HYPERCORE,
          symbol: "USDH-SPOT",
        } as EnrichedToken;

        const predicate = isTokenUnreachable(false, originToken);
        expect(predicate(destinationToken)).toBe(true);
      });

      it("should not mark Hypercore as unreachable when origin is allowed", () => {
        const originToken = {
          chainId: CHAIN_IDs.MAINNET,
          symbol: "USDC",
        } as EnrichedToken;

        const destinationToken = {
          chainId: CHAIN_IDs.HYPERCORE,
          symbol: "USDH-SPOT",
        } as EnrichedToken;

        const predicate = isTokenUnreachable(false, originToken);
        expect(predicate(destinationToken)).toBe(false);
      });
    });

    it("should return false when destination is not an indirect chain", () => {
      const otherToken = {
        chainId: CHAIN_IDs.MAINNET,
        symbol: "USDC",
      } as EnrichedToken;

      const token = {
        chainId: CHAIN_IDs.ARBITRUM,
        symbol: "USDC",
      } as EnrichedToken;

      const predicate = isTokenUnreachable(true, otherToken);
      expect(predicate(token)).toBe(false);
    });
  });

  describe("combined checks", () => {
    it("should mark token as unreachable if both same chain and restricted origin checks fail", () => {
      const otherToken = {
        chainId: CHAIN_IDs.BSC,
        symbol: "USDC",
      } as EnrichedToken;

      // Same chain as otherToken
      const token = {
        chainId: CHAIN_IDs.BSC,
        symbol: "USDT",
      } as EnrichedToken;

      const predicate = isTokenUnreachable(true, otherToken);
      expect(predicate(token)).toBe(true);
    });

    it("should mark token as unreachable if restricted origin check fails even when chains differ", () => {
      const destinationToken = {
        chainId: CHAIN_IDs.HYPERCORE,
        symbol: "USDH-SPOT",
      } as EnrichedToken;

      // Different chain but restricted
      const originToken = {
        chainId: CHAIN_IDs.BSC,
        symbol: "USDC",
      } as EnrichedToken;

      const predicate = isTokenUnreachable(true, destinationToken);
      expect(predicate(originToken)).toBe(true);
    });
  });
});
