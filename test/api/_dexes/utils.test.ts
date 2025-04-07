import { getCrossSwapType, CROSS_SWAP_TYPE } from "../../../api/_dexes/utils";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../../api/_constants";

describe("_dexes/utils", () => {
  describe("#getCrossSwapType()", () => {
    test("L1 stable -> Lens GHO - should return any-to-bridgeable", () => {
      const params = {
        inputToken: TOKEN_SYMBOLS_MAP.DAI.addresses[CHAIN_IDs.MAINNET],
        originChainId: CHAIN_IDs.MAINNET,
        outputToken: TOKEN_SYMBOLS_MAP.WGHO.addresses[CHAIN_IDs.LENS],
        destinationChainId: CHAIN_IDs.LENS,
        isOutputNative: true,
        isInputNative: false,
      };
      const crossSwapType = getCrossSwapType(params);
      expect(crossSwapType).toBe(CROSS_SWAP_TYPE.ANY_TO_BRIDGEABLE);
    });

    test("Lens GHO -> L1 GHO - should return bridgeable-to-any", () => {
      const params = {
        inputToken: TOKEN_SYMBOLS_MAP.WGHO.addresses[CHAIN_IDs.LENS],
        originChainId: CHAIN_IDs.LENS,
        outputToken: TOKEN_SYMBOLS_MAP.GHO.addresses[CHAIN_IDs.MAINNET],
        destinationChainId: CHAIN_IDs.MAINNET,
        isOutputNative: false,
        isInputNative: true,
      };
      const crossSwapType = getCrossSwapType(params);
      expect(crossSwapType).toBe(CROSS_SWAP_TYPE.BRIDGEABLE_TO_ANY);
    });
  });
});
