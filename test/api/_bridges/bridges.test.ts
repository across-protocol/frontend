import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../../api/_constants";
import { getSupportedBridgeStrategies } from "../../../api/_bridges/index";

describe("api/_bridges/index", () => {
  describe("#getSupportedBridgeStrategies()", () => {
    const usdcOptimism = {
      ...TOKEN_SYMBOLS_MAP.USDC,
      chainId: CHAIN_IDs.OPTIMISM,
      address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.OPTIMISM],
    };
    const usdcArbitrum = {
      ...TOKEN_SYMBOLS_MAP.USDC,
      chainId: CHAIN_IDs.ARBITRUM,
      address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.ARBITRUM],
    };

    describe("basic routing preference tests", () => {
      test("should return both across and cctp strategies for USDC with 'default' routing preference", () => {
        const result = getSupportedBridgeStrategies({
          inputToken: usdcOptimism,
          outputToken: usdcArbitrum,
          routingPreference: "default",
        });

        expect(result.length).toBe(2);
        expect(result.map((s) => s.name)).toEqual(
          expect.arrayContaining(["across", "cctp"])
        );
      });

      test("should return only across strategy for USDC with 'across' routing preference", () => {
        const result = getSupportedBridgeStrategies({
          inputToken: usdcOptimism,
          outputToken: usdcArbitrum,
          routingPreference: "across",
        });

        expect(result.length).toBe(1);
        expect(result[0].name).toBe("across");
      });

      test("should return only cctp strategy for USDC with 'native' routing preference", () => {
        const result = getSupportedBridgeStrategies({
          inputToken: usdcOptimism,
          outputToken: usdcArbitrum,
          routingPreference: "native",
        });

        expect(result.length).toBe(1);
        expect(result[0].name).toBe("cctp");
      });
    });
  });
});
