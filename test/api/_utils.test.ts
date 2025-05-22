import { constants } from "@across-protocol/sdk";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../api/_constants";
import {
  getRouteDetails,
  validateChainAndTokenParams,
  ENABLED_ROUTES,
} from "../../api/_utils";

describe("_utils", () => {
  describe("#getRouteDetails()", () => {
    test("should throw if token is unknown", () => {
      const unknownToken = "0x0";
      const destinationChainId = 1;
      expect(() =>
        getRouteDetails(unknownToken, destinationChainId)
      ).toThrowError(/Unsupported token address/);
    });

    test("should throw if token is unknown on given origin chain", () => {
      const knownToken = TOKEN_SYMBOLS_MAP.ACX.addresses[1];
      const destinationChainId = 10;
      const unknownOriginChainId = 99999;
      expect(() =>
        getRouteDetails(knownToken, destinationChainId, unknownOriginChainId)
      ).toThrowError(/Unsupported token on given origin chain/);
    });

    test("should throw if token is not unique across chains and 'originChainId' is omitted", () => {
      // DAI has the same address on Arbitrum and Optimism
      const notUniqueToken = TOKEN_SYMBOLS_MAP.DAI.addresses[10];
      const destinationChainId = 1;
      expect(() =>
        getRouteDetails(notUniqueToken, destinationChainId)
      ).toThrowError(/More than one route is enabled/);
    });

    test("should throw if destination chain unknown", () => {
      const knownToken = TOKEN_SYMBOLS_MAP.ACX.addresses[1];
      const unknownDestinationChainId = 99999;
      expect(() =>
        getRouteDetails(knownToken, unknownDestinationChainId)
      ).toThrowError(/Unsupported token address on given destination chain/);
    });

    test("should throw if provided output token address is not supported on destination chain", () => {
      const originChainId = 1;
      const knownToken = TOKEN_SYMBOLS_MAP.ACX.addresses[originChainId];
      const destinationChainId = 10;
      const outputTokenAddress = TOKEN_SYMBOLS_MAP.ACX.addresses[137];
      expect(() =>
        getRouteDetails(
          knownToken,
          destinationChainId,
          originChainId,
          outputTokenAddress
        )
      ).toThrowError(/Unsupported token address on given destination chain/);
    });

    test("should return route details for unique address across chains", () => {
      const originChainId = 10;
      const uniqueToken = TOKEN_SYMBOLS_MAP.ACX.addresses[originChainId];
      const destinationChainId = 137;
      expect(getRouteDetails(uniqueToken, destinationChainId)).toMatchObject({
        l1Token: {
          address: TOKEN_SYMBOLS_MAP.ACX.addresses[1],
        },
        resolvedOriginChainId: originChainId,
        inputToken: {
          address: uniqueToken,
          symbol: TOKEN_SYMBOLS_MAP.ACX.symbol,
        },
        outputToken: {
          address: TOKEN_SYMBOLS_MAP.ACX.addresses[destinationChainId],
          symbol: TOKEN_SYMBOLS_MAP.ACX.symbol,
        },
      });
    });

    test("should return route details for not unique address across chains", () => {
      // DAI has the same address on Arbitrum and Optimism
      const originChainId = 10;
      const uniqueToken = TOKEN_SYMBOLS_MAP.DAI.addresses[originChainId];
      const destinationChainId = 42161;
      expect(
        getRouteDetails(uniqueToken, destinationChainId, originChainId)
      ).toMatchObject({
        l1Token: {
          address: TOKEN_SYMBOLS_MAP.DAI.addresses[1],
        },
        resolvedOriginChainId: originChainId,
        inputToken: {
          address: uniqueToken,
          symbol: TOKEN_SYMBOLS_MAP.DAI.symbol,
        },
        outputToken: {
          address: TOKEN_SYMBOLS_MAP.DAI.addresses[destinationChainId],
          symbol: TOKEN_SYMBOLS_MAP.DAI.symbol,
        },
      });
    });
  });

  describe("#validateChainAndTokenParams()", () => {
    test("throw if 'destinationChainId' is not provided", () => {
      expect(() => validateChainAndTokenParams({})).toThrowError(
        /Query param 'destinationChainId' must be provided/
      );
    });

    test("throw if 'originChainId' and 'destinationChain' are equal", () => {
      expect(() =>
        validateChainAndTokenParams({
          destinationChainId: "10",
          originChainId: "10",
        })
      ).toThrowError(/Origin and destination chains cannot be the same/);
    });

    test("throw if 'token' is omitted and input/output tokens are not set", () => {
      const expectedErrorRegEx =
        /Query param 'token' or 'inputToken' and 'outputToken' must be provided/;
      expect(() =>
        validateChainAndTokenParams({
          destinationChainId: "10",
        })
      ).toThrowError(expectedErrorRegEx);
      expect(() =>
        validateChainAndTokenParams({
          destinationChainId: "10",
          inputToken: "0x0",
        })
      ).toThrowError(expectedErrorRegEx);
      expect(() =>
        validateChainAndTokenParams({
          destinationChainId: "10",
          outputToken: "0x0",
        })
      ).toThrowError(expectedErrorRegEx);
    });

    test("throw if invalid address provided", () => {
      expect(() =>
        validateChainAndTokenParams({
          destinationChainId: "10",
          token: "0x0",
        })
      ).toThrowError(/Invalid address provided for 'token'/);
      expect(() =>
        validateChainAndTokenParams({
          destinationChainId: "10",
          inputToken: "0x0",
          outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[10],
        })
      ).toThrowError(/Invalid address provided for 'inputToken'/);
      expect(() =>
        validateChainAndTokenParams({
          destinationChainId: "10",
          inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[1],
          outputToken: "0x0",
        })
      ).toThrowError(/Invalid address provided for 'outputToken'/);
    });

    test("resolve all routes for unambiguous tokens and 'token' param", () => {
      const ignoreTokens = [
        "WETH",
        "ETH",
        "ezETH",
        "WBTC",
        ...constants.STABLE_COIN_SYMBOLS,
        "USDC-BNB",
        "USDT-BNB",
        "BNB",
        "WBNB",
      ];
      ENABLED_ROUTES.routes
        .filter(
          (route) =>
            !ignoreTokens.includes(route.fromTokenSymbol) &&
            !ignoreTokens.includes(route.toTokenSymbol)
        )
        .forEach((route) => {
          expect(
            validateChainAndTokenParams({
              token: route.fromTokenAddress,
              destinationChainId: String(route.toChain),
            })
          ).toMatchObject({
            l1Token: {
              address: route.l1TokenAddress,
            },
            inputToken: {
              address: route.fromTokenAddress,
              symbol: route.fromTokenSymbol,
            },
            outputToken: {
              address: route.toTokenAddress,
              symbol: route.toTokenSymbol,
            },
            destinationChainId: route.toChain,
            resolvedOriginChainId: route.fromChain,
          });
        });
    });

    test("resolve all routes for ambiguous tokens and 'token' param", () => {
      ENABLED_ROUTES.routes
        .filter(
          (route) =>
            ["DAI"].includes(route.fromTokenSymbol) &&
            route.toChain !== CHAIN_IDs.BLAST
        )
        .forEach((route) => {
          expect(
            validateChainAndTokenParams({
              token: route.fromTokenAddress,
              originChainId: String(route.fromChain),
              destinationChainId: String(route.toChain),
            })
          ).toMatchObject({
            l1Token: {
              address: route.l1TokenAddress,
            },
            inputToken: {
              address: route.fromTokenAddress,
              symbol: route.fromTokenSymbol,
            },
            outputToken: {
              address: route.toTokenAddress,
              symbol: route.toTokenSymbol,
            },
            destinationChainId: route.toChain,
            resolvedOriginChainId: route.fromChain,
          });
        });
    });

    test("resolve all routes for ETH/WETH and 'token' param", () => {
      ENABLED_ROUTES.routes
        .filter((route) => ["ETH", "WETH"].includes(route.fromTokenSymbol))
        .forEach((route) => {
          expect(
            validateChainAndTokenParams({
              token: route.fromTokenAddress,
              originChainId: String(route.fromChain),
              destinationChainId: String(route.toChain),
            })
          ).toMatchObject({
            l1Token: {
              address: route.l1TokenAddress,
            },
            inputToken: {
              address: route.fromTokenAddress,
            },
            outputToken: {
              address: route.toTokenAddress,
            },
            destinationChainId: route.toChain,
            resolvedOriginChainId: route.fromChain,
          });
        });
    });
  });
});
