import { constants } from "@across-protocol/sdk";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../api/_constants";
import {
  getRouteDetails,
  validateChainAndTokenParams,
  ENABLED_ROUTES,
  validEvmAddress,
  validSvmAddress,
  validAddress,
  getTokenByAddress,
} from "../../api/_utils";
import { is } from "superstruct";

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

  describe("#getTokenByAddress()", () => {
    // Iterate over all chain IDs to test the token resolution for each chain.
    for (const chainId of Object.values(CHAIN_IDs)) {
      if (typeof chainId !== "number") continue;

      const weth = TOKEN_SYMBOLS_MAP.WETH.addresses[chainId];
      const eth = TOKEN_SYMBOLS_MAP.ETH.addresses[chainId];

      // Test case where WETH and ETH have the same address.
      // In this case, we want to ensure that WETH is always returned to avoid ambiguity.
      if (weth && eth && weth.toLowerCase() === eth.toLowerCase()) {
        test(`should return WETH for chain ${chainId} when both ETH and WETH have the same address`, () => {
          const token = getTokenByAddress(weth, chainId);
          expect(token?.symbol).toBe("WETH");
        });
      } else {
        // Test case where WETH and ETH have different addresses.
        if (weth) {
          test(`should return WETH for chain ${chainId}`, () => {
            const token = getTokenByAddress(weth, chainId);
            expect(token?.symbol).toBe("WETH");
          });
        }
        if (eth) {
          test(`should return ETH for chain ${chainId}`, () => {
            const token = getTokenByAddress(eth, chainId);
            expect(token?.symbol).toBe("ETH");
          });
        }
      }
    }

    it("should return undefined for an invalid address", () => {
      const token = getTokenByAddress("0xInvalidAddress");
      expect(token).toBeUndefined();
    });

    it("should correctly resolve ambiguous tokens like USDC", () => {
      const usdcAddresses = TOKEN_SYMBOLS_MAP.USDC.addresses;
      const mainnetChainId = CHAIN_IDs.MAINNET;
      const mainnetUsdcAddress = usdcAddresses[mainnetChainId];

      const token = getTokenByAddress(mainnetUsdcAddress, mainnetChainId);
      expect(token).toBeDefined();
      expect(token?.symbol).toBe("USDC");

      const usdtAddresses = TOKEN_SYMBOLS_MAP.USDT.addresses;
      const mainnetUsdtAddress = usdtAddresses[mainnetChainId];
      const tokenUsdt = getTokenByAddress(mainnetUsdtAddress, mainnetChainId);
      expect(tokenUsdt).toBeDefined();
      expect(tokenUsdt?.symbol).toBe("USDT");
    });

    it("should handle wrapped and ambiguous tokens correctly from TOKEN_SYMBOL_MAP", () => {
      const ambiguousTokens = ["USDC", "USDT"];
      const wrappedTokens = [
        "WETH",
        "WMATIC",
        "WHYPE",
        "TATARA-WBTC",
        "WBNB",
        "WGHO",
        "WGRASS",
        "WSOL",
        "WXPL",
      ];
      const tokensToTest = [...ambiguousTokens, ...wrappedTokens];

      for (const symbol of tokensToTest) {
        const tokenInfo =
          TOKEN_SYMBOLS_MAP[symbol as keyof typeof TOKEN_SYMBOLS_MAP];
        if (tokenInfo) {
          for (const chainId in tokenInfo.addresses) {
            const numericChainId = Number(chainId);
            const address =
              tokenInfo.addresses[
                numericChainId as keyof typeof tokenInfo.addresses
              ];
            const token = getTokenByAddress(address, numericChainId);
            expect(token).toBeDefined();
            expect(token?.symbol).toBe(symbol);
          }
        }
      }
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
});
