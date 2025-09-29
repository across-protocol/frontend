import { getIndirectDestinationRoute } from "../../../api/_dexes/utils-b2bi";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../../api/_constants";

describe("_dexes/utils-b2bi", () => {
  describe("#getIndirectDestinationRoute()", () => {
    test("Optimism USDT -> Arbitrum USDT - should return empty array", () => {
      const params = {
        originChainId: CHAIN_IDs.OPTIMISM,
        destinationChainId: CHAIN_IDs.ARBITRUM,
        inputToken: TOKEN_SYMBOLS_MAP.USDT.addresses[CHAIN_IDs.OPTIMISM],
        outputToken: TOKEN_SYMBOLS_MAP.USDT.addresses[CHAIN_IDs.ARBITRUM],
      };
      const indirectDestinationRoute = getIndirectDestinationRoute(params);
      expect(indirectDestinationRoute).toEqual(undefined);
    });

    test("Optimism USDT -> HyperCore USDT - should return indirect destination routes", () => {
      const params = {
        originChainId: CHAIN_IDs.OPTIMISM,
        destinationChainId: CHAIN_IDs.HYPERCORE,
        inputToken: TOKEN_SYMBOLS_MAP.USDT.addresses[CHAIN_IDs.OPTIMISM],
        outputToken:
          TOKEN_SYMBOLS_MAP["USDT-SPOT"].addresses[CHAIN_IDs.HYPERCORE],
      };
      const indirectDestinationRoute = getIndirectDestinationRoute(params);
      expect(indirectDestinationRoute).toBeTruthy();
      expect(indirectDestinationRoute!.intermediaryOutputToken.symbol).toEqual(
        "USDT"
      );
      expect(indirectDestinationRoute!.intermediaryOutputToken.chainId).toEqual(
        CHAIN_IDs.HYPEREVM
      );
      expect(
        indirectDestinationRoute!.intermediaryOutputToken.decimals
      ).toEqual(6);
      expect(indirectDestinationRoute!.outputToken.symbol).toEqual("USDT-SPOT");
      expect(indirectDestinationRoute!.outputToken.chainId).toEqual(
        CHAIN_IDs.HYPERCORE
      );
      expect(indirectDestinationRoute!.outputToken.decimals).toEqual(8);
    });

    test("BSC USDT -> HyperCore USDT - should return indirect destination routes", () => {
      const params = {
        originChainId: CHAIN_IDs.BSC,
        destinationChainId: CHAIN_IDs.HYPERCORE,
        inputToken: TOKEN_SYMBOLS_MAP["USDT-BNB"].addresses[CHAIN_IDs.BSC],
        outputToken:
          TOKEN_SYMBOLS_MAP["USDT-SPOT"].addresses[CHAIN_IDs.HYPERCORE],
      };
      const indirectDestinationRoute = getIndirectDestinationRoute(params);
      expect(indirectDestinationRoute).toBeTruthy();
      expect(indirectDestinationRoute!.inputToken.symbol).toEqual("USDT-BNB");
      expect(indirectDestinationRoute!.inputToken.chainId).toEqual(
        CHAIN_IDs.BSC
      );
      expect(indirectDestinationRoute!.inputToken.decimals).toEqual(18);
      expect(indirectDestinationRoute!.intermediaryOutputToken.symbol).toEqual(
        "USDT"
      );
      expect(indirectDestinationRoute!.intermediaryOutputToken.chainId).toEqual(
        CHAIN_IDs.HYPEREVM
      );
      expect(
        indirectDestinationRoute!.intermediaryOutputToken.decimals
      ).toEqual(6);
      expect(indirectDestinationRoute!.outputToken.symbol).toEqual("USDT-SPOT");
      expect(indirectDestinationRoute!.outputToken.chainId).toEqual(
        CHAIN_IDs.HYPERCORE
      );
      expect(indirectDestinationRoute!.outputToken.decimals).toEqual(8);
    });

    test("HyperEVM USDT -> HyperCore USDT - should return indirect destination routes", () => {
      const params = {
        originChainId: CHAIN_IDs.HYPEREVM,
        destinationChainId: CHAIN_IDs.HYPERCORE,
        inputToken: TOKEN_SYMBOLS_MAP.USDT.addresses[CHAIN_IDs.HYPEREVM],
        outputToken:
          TOKEN_SYMBOLS_MAP["USDT-SPOT"].addresses[CHAIN_IDs.HYPERCORE],
      };
      const indirectDestinationRoute = getIndirectDestinationRoute(params);
      expect(indirectDestinationRoute).toBeTruthy();
    });
  });
});
