import { isHyperEvmToHyperCoreRoute } from "../../../../../api/_bridges/cctp/utils/hypercore";
import { CHAIN_IDs } from "../../../../../api/_constants";
import { TOKEN_SYMBOLS_MAP } from "../../../../../api/_constants";

describe("bridges -> cctp -> hypercore utils", () => {
  describe("#isHyperEvmToHyperCoreRoute()", () => {
    test("should return true for HyperEVM -> HyperCore", () => {
      const params = {
        inputToken: {
          ...TOKEN_SYMBOLS_MAP.USDC,
          address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.HYPEREVM],
          chainId: CHAIN_IDs.HYPEREVM,
        },
        outputToken: {
          ...TOKEN_SYMBOLS_MAP.USDC,
          address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.HYPERCORE],
          chainId: CHAIN_IDs.HYPERCORE,
        },
      };
      const isRouteSupported = isHyperEvmToHyperCoreRoute(params);
      expect(isRouteSupported).toEqual(true);
    });

    test("should return true for HyperEVM Testnet -> HyperCore Testnet", () => {
      const params = {
        inputToken: {
          ...TOKEN_SYMBOLS_MAP.USDC,
          address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.HYPEREVM_TESTNET],
          chainId: CHAIN_IDs.HYPEREVM_TESTNET,
        },
        outputToken: {
          ...TOKEN_SYMBOLS_MAP.USDC,
          address:
            TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.HYPERCORE_TESTNET],
          chainId: CHAIN_IDs.HYPERCORE_TESTNET,
        },
      };
      const isRouteSupported = isHyperEvmToHyperCoreRoute(params);
      expect(isRouteSupported).toEqual(true);
    });

    test("should return false for HyperCore -> HyperEVM", () => {
      const params = {
        inputToken: {
          ...TOKEN_SYMBOLS_MAP.USDC,
          address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.HYPERCORE],
          chainId: CHAIN_IDs.HYPERCORE,
        },
        outputToken: {
          ...TOKEN_SYMBOLS_MAP.USDC,
          address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.HYPEREVM],
          chainId: CHAIN_IDs.HYPEREVM,
        },
      };
      const isRouteSupported = isHyperEvmToHyperCoreRoute(params);
      expect(isRouteSupported).toEqual(false);
    });
  });
});
