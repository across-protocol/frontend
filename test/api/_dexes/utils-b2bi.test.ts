import { getIndirectDestinationRoutes } from "../../../api/_dexes/utils-b2bi";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../../api/_constants";

describe("_dexes/utils-b2bi", () => {
  describe("#getIndirectDestinationRoutes()", () => {
    test("Optimism USDT -> Arbitrum USDT - should return empty array", () => {
      const params = {
        originChainId: CHAIN_IDs.OPTIMISM,
        destinationChainId: CHAIN_IDs.ARBITRUM,
        inputToken: TOKEN_SYMBOLS_MAP.USDT.addresses[CHAIN_IDs.OPTIMISM],
        outputToken: TOKEN_SYMBOLS_MAP.USDT.addresses[CHAIN_IDs.ARBITRUM],
      };
      const indirectDestinationRoutes = getIndirectDestinationRoutes(params);
      expect(indirectDestinationRoutes).toEqual([]);
    });

    test("Optimism USDT -> HyperCore USDT - should return indirect destination routes", () => {
      const params = {
        originChainId: CHAIN_IDs.OPTIMISM,
        destinationChainId: CHAIN_IDs.HYPERCORE,
        inputToken: TOKEN_SYMBOLS_MAP.USDT.addresses[CHAIN_IDs.OPTIMISM],
        outputToken:
          TOKEN_SYMBOLS_MAP["USDT-SPOT"].addresses[CHAIN_IDs.HYPERCORE],
      };
      const indirectDestinationRoutes = getIndirectDestinationRoutes(params);
      expect(indirectDestinationRoutes.length).toEqual(1);
      expect(
        indirectDestinationRoutes[0].intermediaryOutputToken.symbol
      ).toEqual("USDT");
      expect(
        indirectDestinationRoutes[0].intermediaryOutputToken.chainId
      ).toEqual(CHAIN_IDs.HYPEREVM);
      expect(
        indirectDestinationRoutes[0].intermediaryOutputToken.decimals
      ).toEqual(6);
      expect(indirectDestinationRoutes[0].outputToken.symbol).toEqual(
        "USDT-SPOT"
      );
      expect(indirectDestinationRoutes[0].outputToken.chainId).toEqual(
        CHAIN_IDs.HYPERCORE
      );
      expect(indirectDestinationRoutes[0].outputToken.decimals).toEqual(8);
    });

    test("BSC USDT -> HyperCore USDT - should return indirect destination routes", () => {
      const params = {
        originChainId: CHAIN_IDs.BSC,
        destinationChainId: CHAIN_IDs.HYPERCORE,
        inputToken: TOKEN_SYMBOLS_MAP["USDT-BNB"].addresses[CHAIN_IDs.BSC],
        outputToken:
          TOKEN_SYMBOLS_MAP["USDT-SPOT"].addresses[CHAIN_IDs.HYPERCORE],
      };
      const indirectDestinationRoutes = getIndirectDestinationRoutes(params);
      expect(indirectDestinationRoutes.length).toEqual(1);
      expect(indirectDestinationRoutes[0].inputToken.symbol).toEqual(
        "USDT-BNB"
      );
      expect(indirectDestinationRoutes[0].inputToken.chainId).toEqual(
        CHAIN_IDs.BSC
      );
      expect(indirectDestinationRoutes[0].inputToken.decimals).toEqual(18);
      expect(
        indirectDestinationRoutes[0].intermediaryOutputToken.symbol
      ).toEqual("USDT");
      expect(
        indirectDestinationRoutes[0].intermediaryOutputToken.chainId
      ).toEqual(CHAIN_IDs.HYPEREVM);
      expect(
        indirectDestinationRoutes[0].intermediaryOutputToken.decimals
      ).toEqual(6);
      expect(indirectDestinationRoutes[0].outputToken.symbol).toEqual(
        "USDT-SPOT"
      );
      expect(indirectDestinationRoutes[0].outputToken.chainId).toEqual(
        CHAIN_IDs.HYPERCORE
      );
      expect(indirectDestinationRoutes[0].outputToken.decimals).toEqual(8);
    });

    test("HyperEVM USDT -> HyperCore USDT - should return indirect destination routes", () => {
      const params = {
        originChainId: CHAIN_IDs.HYPEREVM,
        destinationChainId: CHAIN_IDs.HYPERCORE,
        inputToken: TOKEN_SYMBOLS_MAP.USDT.addresses[CHAIN_IDs.HYPEREVM],
        outputToken:
          TOKEN_SYMBOLS_MAP["USDT-SPOT"].addresses[CHAIN_IDs.HYPERCORE],
      };
      const indirectDestinationRoutes = getIndirectDestinationRoutes(params);
      expect(indirectDestinationRoutes).toEqual([]);
    });
  });
});
