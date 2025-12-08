import {
  isTokenUnreachable,
  matchesRestrictedRoute,
  RestrictedRoute,
  RouteParams,
} from "./isTokenUnreachable";
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

  describe("matchesRestrictedRoute", () => {
    describe("exact restriction", () => {
      const restriction: RestrictedRoute = {
        fromChainId: [CHAIN_IDs.MAINNET],
        fromSymbol: ["USDC"],
        toChainId: [CHAIN_IDs.ARBITRUM],
        toSymbol: ["USDT"],
      };

      it("should match when all fields match exactly", () => {
        const route: RouteParams = {
          fromChainId: CHAIN_IDs.MAINNET,
          fromSymbol: "USDC",
          toChainId: CHAIN_IDs.ARBITRUM,
          toSymbol: "USDT",
        };
        expect(matchesRestrictedRoute(route, restriction)).toBe(true);
      });

      it("should not match when any field differs", () => {
        expect(
          matchesRestrictedRoute(
            {
              fromChainId: CHAIN_IDs.MAINNET,
              fromSymbol: "USDT",
              toChainId: CHAIN_IDs.ARBITRUM,
              toSymbol: "USDT",
            },
            restriction
          )
        ).toBe(false);
      });
    });

    it("should match when '*' fields act as wildcards", () => {
      // Test each wildcard pattern
      expect(
        matchesRestrictedRoute(
          {
            fromChainId: CHAIN_IDs.MAINNET,
            fromSymbol: "USDC",
            toChainId: CHAIN_IDs.ARBITRUM,
            toSymbol: "USDT",
          },
          {
            fromChainId: "*",
            fromSymbol: ["USDC"],
            toChainId: [CHAIN_IDs.ARBITRUM],
            toSymbol: ["USDT"],
          }
        )
      ).toBe(true);

      expect(
        matchesRestrictedRoute(
          {
            fromChainId: CHAIN_IDs.MAINNET,
            fromSymbol: "ETH",
            toChainId: CHAIN_IDs.ARBITRUM,
            toSymbol: "USDT",
          },
          {
            fromChainId: [CHAIN_IDs.MAINNET],
            fromSymbol: "*",
            toChainId: [CHAIN_IDs.ARBITRUM],
            toSymbol: ["USDT"],
          }
        )
      ).toBe(true);

      expect(
        matchesRestrictedRoute(
          {
            fromChainId: CHAIN_IDs.MAINNET,
            fromSymbol: "USDC",
            toChainId: CHAIN_IDs.BASE,
            toSymbol: "USDT",
          },
          {
            fromChainId: [CHAIN_IDs.MAINNET],
            fromSymbol: ["USDC"],
            toChainId: "*",
            toSymbol: ["USDT"],
          }
        )
      ).toBe(true);

      expect(
        matchesRestrictedRoute(
          {
            fromChainId: CHAIN_IDs.MAINNET,
            fromSymbol: "USDC",
            toChainId: CHAIN_IDs.ARBITRUM,
            toSymbol: "ETH",
          },
          {
            fromChainId: [CHAIN_IDs.MAINNET],
            fromSymbol: ["USDC"],
            toChainId: [CHAIN_IDs.ARBITRUM],
            toSymbol: "*",
          }
        )
      ).toBe(true);
    });
  });

  it("should restrict ANY output tokens to Solana", () => {
    const inputToken = {
      chainId: CHAIN_IDs.MAINNET,
      symbol: "USDC",
    } as EnrichedToken;

    const outputToken = {
      chainId: CHAIN_IDs.SOLANA,
      symbol: "USDT", // not bridgeable
    } as EnrichedToken;

    const isUnreachable = isTokenUnreachable(inputToken, true, outputToken);

    expect(isUnreachable).toBe(true);
  });

  it("should NOT restrict BRIDGEABLE output tokens to Solana", () => {
    const inputToken = {
      chainId: CHAIN_IDs.MAINNET,
      symbol: "USDC",
    } as EnrichedToken;

    const outputToken = {
      chainId: CHAIN_IDs.SOLANA,
      symbol: "USDC", // not bridgeable
    } as EnrichedToken;

    const isUnreachable = isTokenUnreachable(inputToken, true, outputToken);

    expect(isUnreachable).toBe(false);
  });
});
