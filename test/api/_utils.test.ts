import { constants } from "@across-protocol/sdk";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../api/_constants";
import {
  getRouteDetails,
  validateChainAndTokenParams,
  ENABLED_ROUTES,
  validEvmAddress,
  validSvmAddress,
  validAddress,
  getLimitsSpanAttributes,
} from "../../api/_utils";
import { is } from "superstruct";
import { Token } from "../../api/_dexes/types";

const svmAddress = "9E8PWXZRJa7vBRvGZDmLxSJ4iAMmB4BS7FYUruHvnCPz";
const evmAddress = "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D";
const junkAddress = "0xdeadbeef";

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
        "WBTC",
        ...constants.STABLE_COIN_SYMBOLS,
        "USDC-BNB",
        "USDT-BNB",
        "BNB",
        "VLR",
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

    describe("#validEvmAddress", () => {
      test("Accepts valid EVM address", () => {
        expect(is(evmAddress, validEvmAddress())).toBe(true);
      });

      test("Rejects invalid EVM address", () => {
        expect(is(svmAddress, validEvmAddress())).toBe(false);
        expect(is(junkAddress, validEvmAddress())).toBe(false);
      });
    });

    describe("#validSvmAddress", () => {
      test("Accepts valid SVM address", () => {
        expect(is(svmAddress, validSvmAddress())).toBe(true);
      });

      test("Rejects invalid SVM address", () => {
        expect(is(evmAddress, validSvmAddress())).toBe(false);
        expect(is(junkAddress, validSvmAddress())).toBe(false);
      });
    });
    describe("#validAddress", () => {
      test("Accepts valid SVM address", () => {
        expect(is(svmAddress, validAddress())).toBe(true);
      });

      test("Accepts valid EVM address", () => {
        expect(is(evmAddress, validAddress())).toBe(true);
      });
      test("Rejects invalid addresses", () => {
        expect(is(junkAddress, validAddress())).toBe(false);
      });
    });
  });
  describe("getLimitsSpanAttributes", () => {
    test("should return the correct attributes with mocked prices", async () => {
      const mockGetCachedTokenPrice = async (params: {
        symbol?: string;
      }): Promise<number> => {
        if (params.symbol === "WBTC") {
          return 100000;
        }
        if (params.symbol === "WETH") {
          return 4000;
        }
        if (params.symbol === "ACX") {
          return 0.1;
        }
        return 0;
      };

      const wbtcToken: Token = {
        address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
        symbol: "WBTC",
        decimals: 8,
        chainId: 1,
      };

      const wethToken: Token = {
        address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        symbol: "WETH",
        decimals: 18,
        chainId: 1,
      };

      const acxToken: Token = {
        address: "0x44108f0223a3c3028f5fe7aec7f9bb2e66bef82f",
        symbol: "ACX",
        decimals: 18,
        chainId: 1,
      };

      const wbtcAttributes = await getLimitsSpanAttributes(
        {
          minDeposit: "1000000", // 0.01 WBTC
          maxDeposit: "100000000", // 1 WBTC
          maxDepositInstant: "10000000", // 0.1 WBTC
          maxDepositShortDelay: "50000000", // 0.5 WBTC
        },
        wbtcToken,
        { fetchTokenPrice: mockGetCachedTokenPrice }
      );

      expect(wbtcAttributes).toEqual({
        "limits.minDeposit.token": 0.01,
        "limits.minDeposit.usd": 1000,
        "limits.maxDeposit.token": 1,
        "limits.maxDeposit.usd": 100000,
        "limits.maxDepositInstant.token": 0.1,
        "limits.maxDepositInstant.usd": 10000,
        "limits.maxDepositShortDelay.token": 0.5,
        "limits.maxDepositShortDelay.usd": 50000,
      });

      const wethLimits = {
        minDeposit: "1000000000000000000", // 1 WETH
        maxDeposit: "100000000000000000000", // 100 WETH
        maxDepositInstant: "10000000000000000000", // 10 WETH
        maxDepositShortDelay: "50000000000000000000", // 50 WETH
      };

      const wethAttributes = await getLimitsSpanAttributes(
        wethLimits,
        wethToken,
        { fetchTokenPrice: mockGetCachedTokenPrice }
      );

      expect(wethAttributes).toEqual({
        "limits.minDeposit.token": 1,
        "limits.minDeposit.usd": 4000,
        "limits.maxDeposit.token": 100,
        "limits.maxDeposit.usd": 400000,
        "limits.maxDepositInstant.token": 10,
        "limits.maxDepositInstant.usd": 40000,
        "limits.maxDepositShortDelay.token": 50,
        "limits.maxDepositShortDelay.usd": 200000,
      });

      const acxLimits = {
        minDeposit: "1000000000000000000", // 1 ACX
        maxDeposit: "100000000000000000000", // 100 ACX
        maxDepositInstant: "10000000000000000000", // 10 ACX
        maxDepositShortDelay: "50000000000000000000", // 50 ACX
      };

      const acxAttributes = await getLimitsSpanAttributes(acxLimits, acxToken, {
        fetchTokenPrice: mockGetCachedTokenPrice,
      });

      expect(acxAttributes).toEqual({
        "limits.minDeposit.token": 1,
        "limits.minDeposit.usd": 0.1,
        "limits.maxDeposit.token": 100,
        "limits.maxDeposit.usd": 10,
        "limits.maxDepositInstant.token": 10,
        "limits.maxDepositInstant.usd": 1,
        "limits.maxDepositShortDelay.token": 50,
        "limits.maxDepositShortDelay.usd": 5,
      });
    });

    test("should return valid attributes with real prices", async () => {
      const wethToken: Token = {
        address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        symbol: "WETH",
        decimals: 18,
        chainId: 1,
      };

      const wethLimits = {
        minDeposit: "1000000000000000000", // 1 WETH
        maxDeposit: "100000000000000000000", // 100 WETH
        maxDepositInstant: "10000000000000000000", // 10 WETH
        maxDepositShortDelay: "50000000000000000000", // 50 WETH
      };
      const attributes = await getLimitsSpanAttributes(wethLimits, wethToken);
      expect(typeof attributes["limits.minDeposit.token"]).toBe("number");
      expect(attributes["limits.minDeposit.token"]).toBeGreaterThan(0);
      expect(typeof attributes["limits.minDeposit.usd"]).toBe("number");
      expect(attributes["limits.minDeposit.usd"]).toBeGreaterThan(0);

      expect(typeof attributes["limits.maxDeposit.token"]).toBe("number");
      expect(attributes["limits.maxDeposit.token"]).toBeGreaterThan(0);
      expect(typeof attributes["limits.maxDeposit.usd"]).toBe("number");
      expect(attributes["limits.maxDeposit.usd"]).toBeGreaterThan(0);

      expect(typeof attributes["limits.maxDepositInstant.token"]).toBe(
        "number"
      );
      expect(attributes["limits.maxDepositInstant.token"]).toBeGreaterThan(0);
      expect(typeof attributes["limits.maxDepositInstant.usd"]).toBe("number");
      expect(attributes["limits.maxDepositInstant.usd"]).toBeGreaterThan(0);

      expect(typeof attributes["limits.maxDepositShortDelay.token"]).toBe(
        "number"
      );
      expect(attributes["limits.maxDepositShortDelay.token"]).toBeGreaterThan(
        0
      );
      expect(typeof attributes["limits.maxDepositShortDelay.usd"]).toBe(
        "number"
      );
      expect(attributes["limits.maxDepositShortDelay.usd"]).toBeGreaterThan(0);
    });
  });
});
