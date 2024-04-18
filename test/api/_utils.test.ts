import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../api/_constants";
import { getRouteDetails } from "../../api/_utils";

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

    // @TODO: Remove after switching to CCTP
    describe("pre-CCTP", () => {
      test("should return correct route details for native USDC", () => {
        const originChainId = 1;
        const nativeUsdc = TOKEN_SYMBOLS_MAP.USDC.addresses[originChainId];

        // to Optimism
        expect(getRouteDetails(nativeUsdc, CHAIN_IDs.OPTIMISM)).toMatchObject({
          l1Token: {
            address: nativeUsdc,
          },
          resolvedOriginChainId: originChainId,
          inputToken: {
            address: nativeUsdc,
            symbol: "USDC",
          },
          outputToken: {
            address: TOKEN_SYMBOLS_MAP["USDC.e"].addresses[CHAIN_IDs.OPTIMISM],
            symbol: "USDC.e",
          },
        });
        // to Base
        expect(getRouteDetails(nativeUsdc, CHAIN_IDs.BASE)).toMatchObject({
          l1Token: {
            address: nativeUsdc,
          },
          resolvedOriginChainId: originChainId,
          inputToken: {
            address: nativeUsdc,
            symbol: "USDC",
          },
          outputToken: {
            address: TOKEN_SYMBOLS_MAP.USDbC.addresses[CHAIN_IDs.BASE],
            symbol: "USDbC",
          },
        });
      });

      test("should return correct route details for bridged USDC", () => {
        const originChainId = CHAIN_IDs.OPTIMISM;
        const nativeUsdc = TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.MAINNET];
        const bridgedUsdcOrigin =
          TOKEN_SYMBOLS_MAP["USDC.e"].addresses[originChainId];

        // to Polygon
        expect(
          getRouteDetails(bridgedUsdcOrigin, CHAIN_IDs.POLYGON)
        ).toMatchObject({
          l1Token: {
            address: nativeUsdc,
          },
          resolvedOriginChainId: originChainId,
          inputToken: {
            address: bridgedUsdcOrigin,
            symbol: "USDC.e",
          },
          outputToken: {
            address: TOKEN_SYMBOLS_MAP["USDC.e"].addresses[CHAIN_IDs.POLYGON],
            symbol: "USDC.e",
          },
        });
        // to Base
        expect(
          getRouteDetails(bridgedUsdcOrigin, CHAIN_IDs.BASE)
        ).toMatchObject({
          l1Token: {
            address: nativeUsdc,
          },
          resolvedOriginChainId: originChainId,
          inputToken: {
            address: bridgedUsdcOrigin,
            symbol: "USDC.e",
          },
          outputToken: {
            address: TOKEN_SYMBOLS_MAP.USDbC.addresses[CHAIN_IDs.BASE],
            symbol: "USDbC",
          },
        });
        // to Mainnet
        expect(
          getRouteDetails(bridgedUsdcOrigin, CHAIN_IDs.MAINNET)
        ).toMatchObject({
          l1Token: {
            address: nativeUsdc,
          },
          resolvedOriginChainId: originChainId,
          inputToken: {
            address: bridgedUsdcOrigin,
            symbol: "USDC.e",
          },
          outputToken: {
            address: nativeUsdc,
            symbol: "USDC",
          },
        });
      });
    });
  });
});
