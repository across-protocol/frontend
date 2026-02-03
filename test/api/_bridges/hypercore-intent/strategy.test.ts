import { beforeEach, describe, expect, it, vi } from "vitest";
import { BigNumber } from "ethers";
import { getHyperCoreIntentBridgeStrategy } from "../../../../api/_bridges/hypercore-intent/strategy";
import { getUsdhIntentQuote } from "../../../../api/_bridges/hypercore-intent/utils/quote";
import {
  buildTxEvm,
  buildTxSvm,
} from "../../../../api/_bridges/hypercore-intent/utils/tx-builder";
import { CROSS_SWAP_TYPE } from "../../../../api/_dexes/utils";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../../../api/_constants";
import {
  USDC_ON_OPTIMISM,
  USDH_ON_HYPERCORE,
  USDH_ON_HYPEREVM,
  USDT_ON_POLYGON,
  USDT_SPOT_ON_HYPERCORE,
} from "./utils";
import { getAcrossBridgeStrategy } from "../../../../api/_bridges/across/strategy";
import { FeeDetailsType } from "../../../../api/_dexes/types";
import { assertAccountExistsOnHyperCore } from "../../../../api/_hypercore";

vi.mock("../../../../api/_bridges/hypercore-intent/utils/quote");
vi.mock("../../../../api/_bridges/hypercore-intent/utils/tx-builder");
vi.mock("../../../../api/_bridges/across/strategy", () => ({
  getAcrossBridgeStrategy: vi.fn(),
}));
vi.mock("../../../../api/_hypercore", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../../api/_hypercore")>();
  return {
    ...actual,
    assertAccountExistsOnHyperCore: vi.fn(),
  };
});

describe("getHyperCoreIntentBridgeStrategy", () => {
  const strategy = getHyperCoreIntentBridgeStrategy({
    isEligibleForSponsorship: true,
    shouldSponsorAccountCreation: true,
  });

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

    it("should return ANY_TO_BRIDGEABLE for A2B flow (DAI -> USDT-SPOT)", () => {
      const DAI_ON_POLYGON = {
        address: TOKEN_SYMBOLS_MAP.DAI.addresses[CHAIN_IDs.POLYGON],
        chainId: CHAIN_IDs.POLYGON,
        symbol: "DAI",
        decimals: 18,
      };
      const params = {
        inputToken: DAI_ON_POLYGON,
        outputToken: USDT_SPOT_ON_HYPERCORE,
        isInputNative: false,
        isOutputNative: false,
      };
      expect(strategy.getCrossSwapTypes(params)).toEqual([
        CROSS_SWAP_TYPE.ANY_TO_BRIDGEABLE,
      ]);
    });

    it("should return ANY_TO_BRIDGEABLE for A2B flow (WETH -> USDT-SPOT)", () => {
      const WETH_ON_ARBITRUM = {
        address: TOKEN_SYMBOLS_MAP.WETH.addresses[CHAIN_IDs.ARBITRUM],
        chainId: CHAIN_IDs.ARBITRUM,
        symbol: "WETH",
        decimals: 18,
      };
      const params = {
        inputToken: WETH_ON_ARBITRUM,
        outputToken: USDT_SPOT_ON_HYPERCORE,
        isInputNative: false,
        isOutputNative: false,
      };
      expect(strategy.getCrossSwapTypes(params)).toEqual([
        CROSS_SWAP_TYPE.ANY_TO_BRIDGEABLE,
      ]);
    });

    it("should return BRIDGEABLE_TO_BRIDGEABLE for B2B flow (USDT -> USDT-SPOT)", () => {
      const params = {
        inputToken: USDT_ON_POLYGON,
        outputToken: USDT_SPOT_ON_HYPERCORE,
        isInputNative: false,
        isOutputNative: false,
      };
      expect(strategy.getCrossSwapTypes(params)).toEqual([
        CROSS_SWAP_TYPE.BRIDGEABLE_TO_BRIDGEABLE,
      ]);
    });

    it("should return empty array for unsupported output token", () => {
      const DAI_ON_POLYGON = {
        address: TOKEN_SYMBOLS_MAP.DAI.addresses[CHAIN_IDs.POLYGON],
        chainId: CHAIN_IDs.POLYGON,
        symbol: "DAI",
        decimals: 18,
      };
      const RANDOM_TOKEN = {
        address: "0xabcdef1234567890",
        chainId: CHAIN_IDs.HYPERCORE,
        symbol: "RANDOM",
        decimals: 18,
      };
      const params = {
        inputToken: DAI_ON_POLYGON,
        outputToken: RANDOM_TOKEN,
        isInputNative: false,
        isOutputNative: false,
      };
      expect(strategy.getCrossSwapTypes(params)).toEqual([]);
    });

    it("should return empty array for unsupported destination chain", () => {
      const DAI_ON_POLYGON = {
        address: TOKEN_SYMBOLS_MAP.DAI.addresses[CHAIN_IDs.POLYGON],
        chainId: CHAIN_IDs.POLYGON,
        symbol: "DAI",
        decimals: 18,
      };
      const TOKEN_ON_UNSUPPORTED_CHAIN = {
        address: "0xabcdef1234567890",
        chainId: 999999, // Unsupported destination chain
        symbol: "USDT",
        decimals: 6,
      };
      const params = {
        inputToken: DAI_ON_POLYGON,
        outputToken: TOKEN_ON_UNSUPPORTED_CHAIN,
        isInputNative: false,
        isOutputNative: false,
      };
      expect(strategy.getCrossSwapTypes(params)).toEqual([]);
    });
  });

  describe("getQuoteForExactInput", () => {
    it("should return bridge quote with provider name", async () => {
      const mockQuote = {
        inputToken: USDC_ON_OPTIMISM,
        outputToken: USDH_ON_HYPEREVM,
        inputAmount: BigNumber.from("1000000"),
        outputAmount: BigNumber.from("100000000"),
        minOutputAmount: BigNumber.from("100000000"),
        estimatedFillTimeSec: 60,
        fees: {
          pct: BigNumber.from(0),
          amount: BigNumber.from(0),
          token: USDC_ON_OPTIMISM,
        },
        message: "0x",
      };
      (getUsdhIntentQuote as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockQuote
      );

      const params = {
        inputToken: USDC_ON_OPTIMISM,
        outputToken: USDH_ON_HYPEREVM,
        exactInputAmount: BigNumber.from("1000000"),
        recipient: "0xRecipient",
      };

      const result = await strategy.getQuoteForExactInput(params as any);

      expect(getUsdhIntentQuote).toHaveBeenCalledWith({
        inputToken: params.inputToken,
        outputToken: params.outputToken,
        exactInputAmount: params.exactInputAmount,
        recipient: params.recipient,
      });
      expect(result.bridgeQuote.provider).toBe("sponsored-intent");
      expect(result.bridgeQuote.inputAmount).toEqual(mockQuote.inputAmount);
    });
  });

  describe("getQuoteForOutput", () => {
    it("should convert amount and return bridge quote", async () => {
      const mockQuote = {
        inputToken: USDC_ON_OPTIMISM,
        outputToken: USDH_ON_HYPERCORE,
        inputAmount: BigNumber.from("1000000"),
        outputAmount: BigNumber.from("100000000"),
        minOutputAmount: BigNumber.from("100000000"),
        estimatedFillTimeSec: 60,
        fees: {
          pct: BigNumber.from(0),
          amount: BigNumber.from(0),
          token: USDC_ON_OPTIMISM,
        },
        message: "0x",
      };
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
        exactInputAmount: BigNumber.from("1000000"), // Converted from output decimals (8) to input decimals (6)
        recipient: params.recipient,
      });
      expect(result.bridgeQuote.provider).toBe("sponsored-intent");
      expect(result.bridgeQuote.inputAmount).toEqual(BigNumber.from("1000000"));
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

describe("getHyperCoreIntentBridgeStrategy (unsponsored)", () => {
  const unsponsoredStrategy = getHyperCoreIntentBridgeStrategy({
    isEligibleForSponsorship: false,
    shouldSponsorAccountCreation: false,
  });
  const USDT_ON_POLYGON_TOKEN = {
    address: TOKEN_SYMBOLS_MAP.USDT.addresses[CHAIN_IDs.POLYGON],
    chainId: CHAIN_IDs.POLYGON,
    symbol: "USDT",
    decimals: 6,
  };

  const createMockAcrossQuote = (overrides: {
    inputAmount?: BigNumber;
    outputAmount?: BigNumber;
  }) => ({
    bridgeQuote: {
      inputToken: USDT_ON_POLYGON_TOKEN,
      outputToken: USDT_ON_POLYGON_TOKEN, // Across returns USDT (6 decimals)
      inputAmount: overrides.inputAmount || BigNumber.from("1000000"),
      outputAmount: overrides.outputAmount || BigNumber.from("999990"),
      minOutputAmount: overrides.outputAmount || BigNumber.from("999990"),
      estimatedFillTimeSec: 120,
      provider: "across",
      fees: {
        amount: BigNumber.from("877"),
        pct: BigNumber.from("292666666666666"),
        token: USDT_ON_POLYGON_TOKEN,
        details: {
          type: FeeDetailsType.ACROSS,
          relayerCapital: {
            amount: BigNumber.from("300"),
            pct: BigNumber.from("100000000000000"),
            token: USDT_ON_POLYGON_TOKEN,
          },
          destinationGas: {
            amount: BigNumber.from("577"),
            pct: BigNumber.from("192666666666666"),
            token: USDT_ON_POLYGON_TOKEN,
          },
          lp: {
            amount: BigNumber.from("0"),
            pct: BigNumber.from("0"),
            token: USDT_ON_POLYGON_TOKEN,
          },
        },
      },
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getQuoteForExactInput - unsponsored USDT → USDT-SPOT", () => {
    it("should convert outputAmount from 6 decimals (USDT) to 8 decimals (USDT-SPOT)", async () => {
      const inputAmount = BigNumber.from("1000000"); // 1 USDT (6 decimals)
      const acrossOutputAmount = BigNumber.from("999999"); // Output in 6 decimals (after fees)

      const mockAcrossQuote = createMockAcrossQuote({
        inputAmount,
        outputAmount: acrossOutputAmount,
      });

      (getAcrossBridgeStrategy as ReturnType<typeof vi.fn>).mockReturnValue({
        getQuoteForExactInput: vi.fn().mockResolvedValue(mockAcrossQuote),
      });

      const params = {
        inputToken: USDT_ON_POLYGON,
        outputToken: USDT_SPOT_ON_HYPERCORE,
        exactInputAmount: inputAmount,
        recipient: "0x1234567890123456789012345678901234567890",
      };

      const result = await unsponsoredStrategy.getQuoteForExactInput(
        params as any
      );

      // Output should be converted from 6 decimals to 8 decimals
      const expectedOutputAmount = BigNumber.from("99999900");
      expect(result.bridgeQuote.outputAmount).toEqual(expectedOutputAmount);
      expect(result.bridgeQuote.minOutputAmount).toEqual(expectedOutputAmount);
      expect(result.bridgeQuote.outputToken).toEqual(USDT_SPOT_ON_HYPERCORE);
      expect(result.bridgeQuote.provider).toBe("across");
    });
  });

  describe("getQuoteForOutput - unsponsored USDT → USDT-SPOT", () => {
    it("should convert outputAmount from 6 decimals (USDT) to 8 decimals (USDT-SPOT)", async () => {
      const inputAmount = BigNumber.from("1000000"); // 1 USDT (6 decimals)
      const acrossOutputAmount = BigNumber.from("999999"); // Output in 6 decimals
      const minOutputAmount = BigNumber.from("99999900"); // 1 USDT-SPOT (8 decimals)

      const mockAcrossQuote = createMockAcrossQuote({
        inputAmount,
        outputAmount: acrossOutputAmount,
      });

      (getAcrossBridgeStrategy as ReturnType<typeof vi.fn>).mockReturnValue({
        getQuoteForOutput: vi.fn().mockResolvedValue(mockAcrossQuote),
      });

      const params = {
        inputToken: USDT_ON_POLYGON,
        outputToken: USDT_SPOT_ON_HYPERCORE,
        minOutputAmount,
        recipient: "0x1234567890123456789012345678901234567890",
      };

      const result = await unsponsoredStrategy.getQuoteForOutput(params as any);

      // Output should be converted from 6 decimals to 8 decimals
      // 999,999 (6 decimals) → 99,999,900 (8 decimals)
      const expectedOutputAmount = BigNumber.from("99999900");
      expect(result.bridgeQuote.outputAmount).toEqual(expectedOutputAmount);
      expect(result.bridgeQuote.minOutputAmount).toEqual(expectedOutputAmount);
      expect(result.bridgeQuote.outputToken).toEqual(USDT_SPOT_ON_HYPERCORE);
      expect(result.bridgeQuote.provider).toBe("across");
    });

    it("should throw error if account does not exist on HyperCore", async () => {
      const error = new Error("Account is not initialized on HyperCore");
      (
        assertAccountExistsOnHyperCore as ReturnType<typeof vi.fn>
      ).mockRejectedValue(error);

      const params = {
        inputToken: USDT_ON_POLYGON,
        outputToken: USDT_SPOT_ON_HYPERCORE,
        exactInputAmount: BigNumber.from("1000000"),
        recipient: "0x1234567890123456789012345678901234567890",
      };

      await expect(
        unsponsoredStrategy.getQuoteForExactInput(params as any)
      ).rejects.toThrow("Account is not initialized on HyperCore");
    });
  });
});

describe("getHyperCoreIntentBridgeStrategy (sponsored)", () => {
  const sponsoredStrategy = getHyperCoreIntentBridgeStrategy({
    isEligibleForSponsorship: true,
    shouldSponsorAccountCreation: true,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not check account existence when shouldSponsorAccountCreation is true", async () => {
    const mockQuote = {
      inputToken: USDC_ON_OPTIMISM,
      outputToken: USDH_ON_HYPERCORE,
      inputAmount: BigNumber.from("1000000"),
      outputAmount: BigNumber.from("100000000"),
      minOutputAmount: BigNumber.from("100000000"),
      estimatedFillTimeSec: 60,
      fees: {
        pct: BigNumber.from(0),
        amount: BigNumber.from(0),
        token: USDC_ON_OPTIMISM,
      },
      message: "0x",
    };

    (getUsdhIntentQuote as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockQuote
    );

    const params = {
      inputToken: USDC_ON_OPTIMISM,
      outputToken: USDH_ON_HYPERCORE,
      exactInputAmount: BigNumber.from("1000000"),
      recipient: "0x1234567890123456789012345678901234567890",
    };

    await sponsoredStrategy.getQuoteForExactInput(params as any);

    expect(assertAccountExistsOnHyperCore).not.toHaveBeenCalled();
  });

  describe("resolveOriginSwapTarget", () => {
    it("should resolve USDT for USDT-SPOT output", () => {
      const strategy = getHyperCoreIntentBridgeStrategy({
        isEligibleForSponsorship: false,
        shouldSponsorAccountCreation: false,
      });

      const result = strategy.resolveOriginSwapTarget!({
        inputToken: {
          symbol: "WETH",
          chainId: CHAIN_IDs.ARBITRUM,
          address: TOKEN_SYMBOLS_MAP.WETH.addresses[CHAIN_IDs.ARBITRUM],
          decimals: 18,
        },
        outputToken: {
          symbol: "USDT-SPOT",
          chainId: CHAIN_IDs.HYPERCORE,
          address:
            TOKEN_SYMBOLS_MAP["USDT-SPOT"].addresses[CHAIN_IDs.HYPERCORE],
          decimals: 6,
        },
      });

      expect(result).toBeDefined();
      expect(result!.symbol).toBe("USDT");
      expect(result!.chainId).toBe(CHAIN_IDs.ARBITRUM);
      expect(result!.address).toBe(
        TOKEN_SYMBOLS_MAP.USDT.addresses[CHAIN_IDs.ARBITRUM]
      );
      expect(result!.decimals).toBe(6);
    });

    it("should return undefined for unsupported output token", () => {
      const strategy = getHyperCoreIntentBridgeStrategy({
        isEligibleForSponsorship: false,
        shouldSponsorAccountCreation: false,
      });

      const result = strategy.resolveOriginSwapTarget!({
        inputToken: {
          symbol: "WETH",
          chainId: CHAIN_IDs.ARBITRUM,
          address: TOKEN_SYMBOLS_MAP.WETH.addresses[CHAIN_IDs.ARBITRUM],
          decimals: 18,
        },
        outputToken: {
          symbol: "UNKNOWN",
          chainId: CHAIN_IDs.HYPERCORE,
          address: "0xabcdef1234567890",
          decimals: 18,
        },
      });

      expect(result).toBeUndefined();
    });

    it("should return undefined if bridgeable token not available on origin chain", () => {
      const strategy = getHyperCoreIntentBridgeStrategy({
        isEligibleForSponsorship: false,
        shouldSponsorAccountCreation: false,
      });

      const result = strategy.resolveOriginSwapTarget!({
        inputToken: {
          symbol: "WETH",
          chainId: 999999, // Unsupported chain
          address: "0x1234567890abcdef",
          decimals: 18,
        },
        outputToken: {
          symbol: "USDT-SPOT",
          chainId: CHAIN_IDs.HYPERCORE,
          address:
            TOKEN_SYMBOLS_MAP["USDT-SPOT"].addresses[CHAIN_IDs.HYPERCORE],
          decimals: 6,
        },
      });

      expect(result).toBeUndefined();
    });
  });
});
