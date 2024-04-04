import { TOKEN_SYMBOLS_MAP } from "@across-protocol/constants-v2";
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

    test("should throw if destination token unknown", () => {
      const knownToken = TOKEN_SYMBOLS_MAP.ACX.addresses[1];
      const unknownDestinationChainId = 99999;
      expect(() =>
        getRouteDetails(knownToken, unknownDestinationChainId)
      ).toThrowError(/Unsupported token address on given destination chain/);
    });

    test("should return route details for unique address across chains", () => {
      const originChainId = 10;
      const uniqueToken = TOKEN_SYMBOLS_MAP.ACX.addresses[originChainId];
      const destinationChainId = 137;
      expect(getRouteDetails(uniqueToken, destinationChainId)).toMatchObject({
        l1Token: TOKEN_SYMBOLS_MAP.ACX.addresses[1],
        resolvedOriginChainId: originChainId,
        inputToken: TOKEN_SYMBOLS_MAP.ACX.addresses[originChainId],
        outputToken: TOKEN_SYMBOLS_MAP.ACX.addresses[destinationChainId],
        decimals: TOKEN_SYMBOLS_MAP.ACX.decimals,
        symbol: TOKEN_SYMBOLS_MAP.ACX.symbol,
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
        l1Token: TOKEN_SYMBOLS_MAP.DAI.addresses[1],
        resolvedOriginChainId: originChainId,
        inputToken: TOKEN_SYMBOLS_MAP.DAI.addresses[originChainId],
        outputToken: TOKEN_SYMBOLS_MAP.DAI.addresses[destinationChainId],
        decimals: TOKEN_SYMBOLS_MAP.DAI.decimals,
        symbol: TOKEN_SYMBOLS_MAP.DAI.symbol,
      });
    });
  });
});
