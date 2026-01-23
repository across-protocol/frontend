import { beforeEach, describe, expect, it, vi } from "vitest";
import { BigNumber } from "ethers";
import { getUsdhIntentsBridgeStrategy } from "../../../../api/_bridges/sponsored-intent/strategy";
import { getUsdhIntentQuote } from "../../../../api/_bridges/sponsored-intent/utils/quote";
import {
  buildTxEvm,
  buildTxSvm,
} from "../../../../api/_bridges/sponsored-intent/utils/tx-builder";
import { CROSS_SWAP_TYPE } from "../../../../api/_dexes/utils";
import { Token } from "../../../../api/_dexes/types";
import { CHAIN_IDs } from "../../../../api/_constants";
import {
  USDC_ON_OPTIMISM,
  USDC_ON_SCROLL,
  USDC_ON_LENS,
  USDCe_ON_ZKSYNC,
  USDzC_ON_ZORA,
  USDH_ON_HYPERCORE,
  USDH_ON_HYPEREVM,
} from "./utils";

vi.mock("../../../../api/_bridges/sponsored-intent/utils/quote");
vi.mock("../../../../api/_bridges/sponsored-intent/utils/tx-builder");

describe("getUsdhIntentsBridgeStrategy", () => {
  const strategy = getUsdhIntentsBridgeStrategy();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCrossSwapTypes", () => {
    it("should return BRIDGEABLE_TO_BRIDGEABLE for supported route USDC on Optimism -> USDH on HyperEVM", () => {
      const params = {
        inputToken: USDC_ON_OPTIMISM,
        outputToken: USDH_ON_HYPEREVM,
        isInputNative: false,
        isOutputNative: false,
      };
      expect(strategy.getCrossSwapTypes(params)).toEqual([
        CROSS_SWAP_TYPE.BRIDGEABLE_TO_BRIDGEABLE,
      ]);
    });

    it("should return BRIDGEABLE_TO_BRIDGEABLE for supported route USDC on Optimism -> USDH on HyperCore", () => {
      const params = {
        inputToken: USDC_ON_OPTIMISM,
        outputToken: USDH_ON_HYPERCORE,
        isInputNative: false,
        isOutputNative: false,
      };
      expect(strategy.getCrossSwapTypes(params)).toEqual([
        CROSS_SWAP_TYPE.BRIDGEABLE_TO_BRIDGEABLE,
      ]);
    });

    it("should return empty array for unsupported input token", () => {
      const params = {
        inputToken: {
          address: "0x123", // Random address
          chainId: CHAIN_IDs.OPTIMISM,
          symbol: "RANDOM",
          decimals: 18,
        },
        outputToken: USDH_ON_HYPEREVM,
        isInputNative: false,
        isOutputNative: false,
      };
      expect(strategy.getCrossSwapTypes(params)).toEqual([]);
    });

    it("should return BRIDGEABLE_TO_BRIDGEABLE for non-CCTP origin chains with supported USDC tokens", () => {
      const nonCctpTokens = [
        USDC_ON_SCROLL,
        USDC_ON_LENS,
        USDCe_ON_ZKSYNC,
        USDzC_ON_ZORA,
      ];
      nonCctpTokens.forEach((inputToken) => {
        const params = {
          inputToken,
          outputToken: USDH_ON_HYPERCORE,
          isInputNative: false,
          isOutputNative: false,
        };
        expect(strategy.getCrossSwapTypes(params)).toEqual([
          CROSS_SWAP_TYPE.BRIDGEABLE_TO_BRIDGEABLE,
        ]);
      });
    });

    it("should return empty array for unsupported origin chain", () => {
      const params = {
        inputToken: {
          symbol: "USDC",
          decimals: 6,
          address: "0x1234567890abcdef1234567890abcdef12345678",
          chainId: 999999, // Non-existent chain
        },
        outputToken: USDH_ON_HYPERCORE,
        isInputNative: false,
        isOutputNative: false,
      };
      expect(strategy.getCrossSwapTypes(params)).toEqual([]);
    });
  });

  describe("getQuoteForExactInput", () => {
    it("should return bridge quote with provider name", async () => {
      const mockQuote = {
        inputToken: {} as Token,
        outputToken: {} as Token,
        inputAmount: BigNumber.from(100),
        outputAmount: BigNumber.from(100),
        minOutputAmount: BigNumber.from(100),
        estimatedFillTimeSec: 60,
        fees: {
          pct: BigNumber.from(0),
          amount: BigNumber.from(0),
          token: {} as Token,
        },
        message: "0x",
      };
      (getUsdhIntentQuote as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockQuote
      );

      const params = {
        inputToken: {} as Token,
        outputToken: {} as Token,
        exactInputAmount: BigNumber.from(100),
        recipient: "0xRecipient",
      };

      const result = await strategy.getQuoteForExactInput(params as any);

      expect(getUsdhIntentQuote).toHaveBeenCalledWith({
        inputToken: params.inputToken,
        outputToken: params.outputToken,
        exactInputAmount: params.exactInputAmount,
        recipient: params.recipient,
      });
      expect(result).toEqual({
        bridgeQuote: {
          ...mockQuote,
          provider: "sponsored-intent",
        },
      });
    });
  });

  describe("getQuoteForOutput", () => {
    it("should convert amount and return bridge quote", async () => {
      const mockQuote = { some: "quote" };
      (getUsdhIntentQuote as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockQuote
      );

      const params = {
        inputToken: USDC_ON_OPTIMISM,
        outputToken: USDH_ON_HYPERCORE,
        minOutputAmount: BigNumber.from("100000000"), // 1.0 USDH on HyperCore
        recipient: "0xRecipient",
      };

      const result = await strategy.getQuoteForOutput(params);

      expect(getUsdhIntentQuote).toHaveBeenCalledWith({
        inputToken: params.inputToken,
        outputToken: params.outputToken,
        exactInputAmount: BigNumber.from("1000000"), // 1.0 USDH on Optimism
        recipient: params.recipient,
      });
      expect(result).toEqual({
        bridgeQuote: {
          ...mockQuote,
          provider: "sponsored-intent",
        },
      });
    });
  });

  describe("buildTxForAllowanceHolder", () => {
    it("should call buildTxSvm if origin is SVM", async () => {
      const params = {
        quotes: {
          crossSwap: { isOriginSvm: true },
        },
      };
      (buildTxSvm as ReturnType<typeof vi.fn>).mockResolvedValue("svm-tx");

      const result = await strategy.buildTxForAllowanceHolder(params as any);

      expect(buildTxSvm).toHaveBeenCalledWith(params);
      expect(result).toBe("svm-tx");
    });

    it("should call buildTxEvm if origin is not SVM", async () => {
      const params = {
        quotes: {
          crossSwap: { isOriginSvm: false },
        },
      };
      (buildTxEvm as ReturnType<typeof vi.fn>).mockResolvedValue("evm-tx");

      const result = await strategy.buildTxForAllowanceHolder(params as any);

      expect(buildTxEvm).toHaveBeenCalledWith(params);
      expect(result).toBe("evm-tx");
    });
  });
});
