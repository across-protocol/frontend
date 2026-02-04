import { expect, test, describe } from "vitest";

import { getSponsoredGaslessRoute } from "../../api/_sponsored-gasless-config";
import { CHAIN_IDs } from "../../api/_constants";

describe("api/_sponsored-gasless-config", () => {
  describe("#getSponsoredGaslessRoute()", () => {
    const validParams = {
      apiKeyName: "coinbase",
      apiKeyPermissions: ["sponsored-gasless" as const],
      originChainId: CHAIN_IDs.BASE,
      destinationChainId: CHAIN_IDs.ARBITRUM,
      inputTokenSymbol: "USDC",
      outputTokenSymbol: "USDC",
      permitType: "erc3009",
    };

    describe("returns true for valid sponsored routes", () => {
      test("USDC -> USDC on allowed chains with valid API key", () => {
        expect(getSponsoredGaslessRoute(validParams)).toBeTruthy();
      });

      test("works for all allowed origin chains", () => {
        const allowedOriginChains = [
          CHAIN_IDs.MAINNET,
          CHAIN_IDs.ARBITRUM,
          CHAIN_IDs.BASE,
          CHAIN_IDs.OPTIMISM,
          CHAIN_IDs.POLYGON,
        ];

        for (const originChainId of allowedOriginChains) {
          expect(
            getSponsoredGaslessRoute({ ...validParams, originChainId })
          ).toBeTruthy();
        }
      });

      test("works for all allowed destination chains", () => {
        const allowedDestinationChains = [
          CHAIN_IDs.MAINNET,
          CHAIN_IDs.ARBITRUM,
          CHAIN_IDs.BASE,
          CHAIN_IDs.OPTIMISM,
          CHAIN_IDs.POLYGON,
        ];

        for (const destinationChainId of allowedDestinationChains) {
          expect(
            getSponsoredGaslessRoute({ ...validParams, destinationChainId })
          ).toBeTruthy();
        }
      });
    });

    describe("returns false when API key is missing or invalid", () => {
      test("returns false when apiKeyName is undefined", () => {
        expect(
          getSponsoredGaslessRoute({ ...validParams, apiKeyName: undefined })
        ).toBeFalsy();
      });

      test("returns false when apiKeyPermissions is undefined", () => {
        expect(
          getSponsoredGaslessRoute({
            ...validParams,
            apiKeyPermissions: undefined,
          })
        ).toBeFalsy();
      });

      test("returns false when API key lacks sponsored-gasless permission", () => {
        expect(
          getSponsoredGaslessRoute({ ...validParams, apiKeyPermissions: [] })
        ).toBeFalsy();
      });
    });

    describe("returns false for unsupported chains", () => {
      test("returns false for unsupported origin chain", () => {
        expect(
          getSponsoredGaslessRoute({
            ...validParams,
            originChainId: CHAIN_IDs.LINEA,
          })
        ).toBeFalsy();
      });

      test("returns false for unsupported destination chain", () => {
        expect(
          getSponsoredGaslessRoute({
            ...validParams,
            destinationChainId: CHAIN_IDs.LINEA,
          })
        ).toBeFalsy();
      });
    });

    describe("returns false for unsupported tokens", () => {
      test("returns false for non-USDC input token", () => {
        expect(
          getSponsoredGaslessRoute({ ...validParams, inputTokenSymbol: "ETH" })
        ).toBeFalsy();
      });

      test("returns false for non-USDC output token", () => {
        expect(
          getSponsoredGaslessRoute({ ...validParams, outputTokenSymbol: "ETH" })
        ).toBeFalsy();
      });

      test("returns false for USDT -> USDT", () => {
        expect(
          getSponsoredGaslessRoute({
            ...validParams,
            inputTokenSymbol: "USDT",
            outputTokenSymbol: "USDT",
          })
        ).toBeFalsy();
      });
    });
  });
});
