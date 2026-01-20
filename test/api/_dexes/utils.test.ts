import { BigNumber, constants } from "ethers";
import { describe, expect, test, vi } from "vitest";

import {
  CROSS_SWAP_TYPE,
  getAcrossFallbackRecipient,
  getBridgeQuoteMessage,
  getBridgeQuoteRecipient,
  getCrossSwapTypes,
  getMintBurnRefundRecipient,
  getQuoteFetchStrategies,
  QuoteFetchStrategies,
} from "../../../api/_dexes/utils";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../../api/_constants";
import { CrossSwap, QuoteFetchStrategy } from "../../../api/_dexes/types";
import { getMultiCallHandlerAddress } from "../../../api/_multicall-handler";

// Mock addresses for testing EOA vs Contract behavior
const MOCK_EOA_ADDRESS = "0xEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE";
const MOCK_CONTRACT_ADDRESS = "0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC";

// Mock isContractCache to control EOA vs Contract detection
vi.mock("../../../api/_utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../api/_utils")>();
  return {
    ...actual,
    isContractCache: vi.fn((_chainId: number, address: string) => {
      const isContract =
        address.toLowerCase() === MOCK_CONTRACT_ADDRESS.toLowerCase();
      return {
        get: vi.fn(() => Promise.resolve(isContract)),
      };
    }),
  };
});

// Shared helper to create mock CrossSwap objects
const createMockCrossSwap = (overrides?: Partial<CrossSwap>): CrossSwap => ({
  amount: BigNumber.from("1000000"),
  inputToken: {
    address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.OPTIMISM],
    decimals: 6,
    symbol: "USDC",
    chainId: CHAIN_IDs.OPTIMISM,
  },
  outputToken: {
    address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.ARBITRUM],
    decimals: 6,
    symbol: "USDC",
    chainId: CHAIN_IDs.ARBITRUM,
  },
  depositor: "0xDepositor000000000000000000000000000000000",
  recipient: "0xRecipient000000000000000000000000000000000",
  slippageTolerance: 0.5,
  type: "exactInput",
  refundOnOrigin: false,
  embeddedActions: [],
  strictTradeType: false,
  ...overrides,
});

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
      const crossSwapTypes = getCrossSwapTypes(params);
      expect(crossSwapTypes).toEqual([CROSS_SWAP_TYPE.ANY_TO_BRIDGEABLE]);
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
      const crossSwapTypes = getCrossSwapTypes(params);
      expect(crossSwapTypes).toEqual([CROSS_SWAP_TYPE.BRIDGEABLE_TO_ANY]);
    });

    test("Optimism USDC -> Arbitrum USDC - should return bridgeable-to-bridgeable", () => {
      const params = {
        inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.OPTIMISM],
        originChainId: CHAIN_IDs.OPTIMISM,
        outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.ARBITRUM],
        destinationChainId: CHAIN_IDs.ARBITRUM,
        isOutputNative: false,
        isInputNative: false,
      };
      const crossSwapTypes = getCrossSwapTypes(params);
      expect(crossSwapTypes).toEqual([
        CROSS_SWAP_TYPE.BRIDGEABLE_TO_BRIDGEABLE,
      ]);
    });

    test("Optimism USDC -> Arbitrum ETH - should return any-to-bridgeable and bridgeable-to-any", () => {
      const params = {
        inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.OPTIMISM],
        originChainId: CHAIN_IDs.OPTIMISM,
        outputToken: TOKEN_SYMBOLS_MAP.ETH.addresses[CHAIN_IDs.ARBITRUM],
        destinationChainId: CHAIN_IDs.ARBITRUM,
        isOutputNative: false,
        isInputNative: false,
      };
      const crossSwapTypes = getCrossSwapTypes(params);
      expect(crossSwapTypes).toEqual([
        CROSS_SWAP_TYPE.ANY_TO_BRIDGEABLE,
        CROSS_SWAP_TYPE.BRIDGEABLE_TO_ANY,
      ]);
    });
  });

  describe("#getBridgeQuoteRecipient() and #getBridgeQuoteMessage()", () => {
    describe("Bypass MultiCallHandler conditions", () => {
      test("should bypass for simple B2B transfers with all tradeTypes", async () => {
        const tradeTypes = ["exactInput", "minOutput", "exactOutput"] as const;

        for (const type of tradeTypes) {
          const crossSwap = createMockCrossSwap({ type });
          const recipient = await getBridgeQuoteRecipient(crossSwap, false);
          const message = await getBridgeQuoteMessage(crossSwap);

          expect(recipient).toBe(crossSwap.recipient);
          expect(message).toBeUndefined();
        }
      });

      test("should bypass with zero app fees", async () => {
        const crossSwap = createMockCrossSwap({
          type: "exactInput",
          appFeePercent: 0,
          appFeeRecipient: "0xFEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
        });
        const recipient = await getBridgeQuoteRecipient(crossSwap, false);
        const message = await getBridgeQuoteMessage(crossSwap);

        expect(recipient).toBe(crossSwap.recipient);
        expect(message).toBeUndefined();
      });

      test("should bypass MultiCallHandler for SVM destination", async () => {
        const crossSwap = createMockCrossSwap({
          isDestinationSvm: true,
        });
        const recipient = await getBridgeQuoteRecipient(crossSwap);
        const message = await getBridgeQuoteMessage(crossSwap);

        expect(recipient).toBe(crossSwap.recipient);
        expect(message).toBeUndefined();
      });
    });

    describe("Use MultiCallHandler conditions", () => {
      test("should use MultiCallHandler with app fees (exactInput)", async () => {
        const crossSwap = createMockCrossSwap({
          type: "exactInput",
          appFeePercent: 0.01,
          appFeeRecipient: "0xFEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
        });
        const recipient = await getBridgeQuoteRecipient(crossSwap, false);
        const message = await getBridgeQuoteMessage(crossSwap);

        const multicallHandler = getMultiCallHandlerAddress(
          crossSwap.outputToken.chainId
        );
        expect(recipient).toBe(multicallHandler);
        expect(message).toBeDefined();
        expect(message).not.toBe("");
        expect(message).not.toBe("0x");
      });

      test("should use MultiCallHandler with embedded actions (minOutput)", async () => {
        const crossSwap = createMockCrossSwap({
          type: "minOutput",
          embeddedActions: [
            {
              target: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
              functionSignature: "function test()",
              isNativeTransfer: false,
              args: [],
              value: "0",
              populateCallValueDynamically: false,
            },
          ],
        });
        const recipient = await getBridgeQuoteRecipient(crossSwap, false);
        const message = await getBridgeQuoteMessage(crossSwap);

        const multicallHandler = getMultiCallHandlerAddress(
          crossSwap.outputToken.chainId
        );
        expect(recipient).toBe(multicallHandler);
        expect(message).toBeDefined();
        expect(message).not.toBe("");
        expect(message).not.toBe("0x");
      });

      test("should use MultiCallHandler with wrapped native output to EOA (exactInput)", async () => {
        const crossSwap = createMockCrossSwap({
          type: "exactInput",
          outputToken: {
            address: TOKEN_SYMBOLS_MAP.WETH.addresses[CHAIN_IDs.ARBITRUM],
            decimals: 18,
            symbol: "WETH",
            chainId: CHAIN_IDs.ARBITRUM,
          },
          recipient: MOCK_EOA_ADDRESS,
          isOutputNative: false,
        });
        const recipient = await getBridgeQuoteRecipient(crossSwap, false);
        const message = await getBridgeQuoteMessage(crossSwap);

        const multicallHandler = getMultiCallHandlerAddress(
          crossSwap.outputToken.chainId
        );
        expect(recipient).toBe(multicallHandler);
        expect(message).toBeDefined();
        expect(message).not.toBe("");
        expect(message).not.toBe("0x");
      });
    });

    describe("A2B bridge with origin swap (should use MultiCallHandler)", () => {
      const mockOriginSwapQuote = {
        tokenIn: {
          address: TOKEN_SYMBOLS_MAP.DAI.addresses[CHAIN_IDs.OPTIMISM],
          decimals: 18,
          symbol: "DAI",
          chainId: CHAIN_IDs.OPTIMISM,
        },
        tokenOut: {
          address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.OPTIMISM],
          decimals: 6,
          symbol: "USDC",
          chainId: CHAIN_IDs.OPTIMISM,
        },
        maximumAmountIn: BigNumber.from("1100000000000000000"),
        minAmountOut: BigNumber.from("990000"),
        expectedAmountIn: BigNumber.from("1000000000000000000"),
        expectedAmountOut: BigNumber.from("1000000"),
        slippageTolerance: 0.5,
        swapProvider: { name: "uniswap", sources: [] },
        swapTxns: [],
      };

      test("should use MultiCallHandler for A2B with exactInput", async () => {
        const crossSwap = createMockCrossSwap({
          type: "exactInput",
        });
        const recipient = await getBridgeQuoteRecipient(crossSwap, true);
        const message = await getBridgeQuoteMessage(
          crossSwap,
          undefined,
          mockOriginSwapQuote
        );

        const multicallHandler = getMultiCallHandlerAddress(
          crossSwap.outputToken.chainId
        );
        expect(recipient).toBe(multicallHandler);
        expect(message).toBeDefined();
        expect(message).not.toBe("");
        expect(message).not.toBe("0x");
      });

      test("should use MultiCallHandler for A2B with minOutput", async () => {
        const crossSwap = createMockCrossSwap({
          type: "minOutput",
        });
        const recipient = await getBridgeQuoteRecipient(crossSwap, true);
        const message = await getBridgeQuoteMessage(
          crossSwap,
          undefined,
          mockOriginSwapQuote
        );

        const multicallHandler = getMultiCallHandlerAddress(
          crossSwap.outputToken.chainId
        );
        expect(recipient).toBe(multicallHandler);
        expect(message).toBeDefined();
        expect(message).not.toBe("");
        expect(message).not.toBe("0x");
      });

      test("should use MultiCallHandler for A2B with exactOutput", async () => {
        const crossSwap = createMockCrossSwap({
          type: "exactOutput",
        });
        const recipient = await getBridgeQuoteRecipient(crossSwap, true);
        const message = await getBridgeQuoteMessage(
          crossSwap,
          undefined,
          mockOriginSwapQuote
        );

        const multicallHandler = getMultiCallHandlerAddress(
          crossSwap.outputToken.chainId
        );
        expect(recipient).toBe(multicallHandler);
        expect(message).toBeDefined();
        expect(message).not.toBe("");
        expect(message).not.toBe("0x");
      });
    });

    describe("Native/Wrapped Native with EOA/Contract Recipients", () => {
      describe("Native token on standard chains", () => {
        test("should bypass when native output to EOA (exactInput)", async () => {
          const crossSwap = createMockCrossSwap({
            type: "exactInput",
            outputToken: {
              address: TOKEN_SYMBOLS_MAP.ETH.addresses[CHAIN_IDs.ARBITRUM],
              decimals: 18,
              symbol: "ETH",
              chainId: CHAIN_IDs.ARBITRUM,
            },
            recipient: MOCK_EOA_ADDRESS,
            isOutputNative: true,
          });
          const recipient = await getBridgeQuoteRecipient(crossSwap, false);
          const message = await getBridgeQuoteMessage(crossSwap);

          expect(recipient).toBe(crossSwap.recipient);
          expect(message).toBeUndefined();
        });

        test("should use MultiCallHandler when native output to Contract (minOutput)", async () => {
          const crossSwap = createMockCrossSwap({
            type: "minOutput",
            outputToken: {
              address: TOKEN_SYMBOLS_MAP.ETH.addresses[CHAIN_IDs.ARBITRUM],
              decimals: 18,
              symbol: "ETH",
              chainId: CHAIN_IDs.ARBITRUM,
            },
            recipient: MOCK_CONTRACT_ADDRESS,
            isOutputNative: true,
          });
          const recipient = await getBridgeQuoteRecipient(crossSwap, false);
          const message = await getBridgeQuoteMessage(crossSwap);

          const multicallHandler = getMultiCallHandlerAddress(
            crossSwap.outputToken.chainId
          );
          expect(recipient).toBe(multicallHandler);
          expect(message).toBeDefined();
          expect(message).not.toBe("");
          expect(message).not.toBe("0x");
        });
      });

      describe("Wrapped native token (WETH) on standard chains", () => {
        test("should use MultiCallHandler when WETH output to EOA (exactInput)", async () => {
          const crossSwap = createMockCrossSwap({
            type: "exactInput",
            outputToken: {
              address: TOKEN_SYMBOLS_MAP.WETH.addresses[CHAIN_IDs.ARBITRUM],
              decimals: 18,
              symbol: "WETH",
              chainId: CHAIN_IDs.ARBITRUM,
            },
            recipient: MOCK_EOA_ADDRESS,
            isOutputNative: false,
          });
          const recipient = await getBridgeQuoteRecipient(crossSwap, false);
          const message = await getBridgeQuoteMessage(crossSwap);

          const multicallHandler = getMultiCallHandlerAddress(
            crossSwap.outputToken.chainId
          );
          expect(recipient).toBe(multicallHandler);
          expect(message).toBeDefined();
          expect(message).not.toBe("");
          expect(message).not.toBe("0x");
        });

        test("should bypass when WETH output to Contract (minOutput)", async () => {
          const crossSwap = createMockCrossSwap({
            type: "minOutput",
            outputToken: {
              address: TOKEN_SYMBOLS_MAP.WETH.addresses[CHAIN_IDs.ARBITRUM],
              decimals: 18,
              symbol: "WETH",
              chainId: CHAIN_IDs.ARBITRUM,
            },
            recipient: MOCK_CONTRACT_ADDRESS,
            isOutputNative: false,
          });
          const recipient = await getBridgeQuoteRecipient(crossSwap, false);
          const message = await getBridgeQuoteMessage(crossSwap);

          expect(recipient).toBe(crossSwap.recipient);
          expect(message).toBeUndefined();
        });
      });

      describe("Chain exceptions - zkSync and Lens always need message for native/wrapped native", () => {
        test("should use MultiCallHandler for native output to EOA on zkSync (exactInput)", async () => {
          const crossSwap = createMockCrossSwap({
            type: "exactInput",
            outputToken: {
              address: TOKEN_SYMBOLS_MAP.ETH.addresses[CHAIN_IDs.ZK_SYNC],
              decimals: 18,
              symbol: "ETH",
              chainId: CHAIN_IDs.ZK_SYNC,
            },
            recipient: MOCK_EOA_ADDRESS,
            isOutputNative: true,
          });
          const recipient = await getBridgeQuoteRecipient(crossSwap, false);
          const message = await getBridgeQuoteMessage(crossSwap);

          const multicallHandler = getMultiCallHandlerAddress(
            crossSwap.outputToken.chainId
          );
          expect(recipient).toBe(multicallHandler);
          expect(message).toBeDefined();
          expect(message).not.toBe("");
          expect(message).not.toBe("0x");
        });

        test("should use MultiCallHandler for WETH output to Contract on zkSync (minOutput)", async () => {
          const crossSwap = createMockCrossSwap({
            type: "minOutput",
            outputToken: {
              address: TOKEN_SYMBOLS_MAP.WETH.addresses[CHAIN_IDs.ZK_SYNC],
              decimals: 18,
              symbol: "WETH",
              chainId: CHAIN_IDs.ZK_SYNC,
            },
            recipient: MOCK_CONTRACT_ADDRESS,
            isOutputNative: false,
          });
          const recipient = await getBridgeQuoteRecipient(crossSwap, false);
          const message = await getBridgeQuoteMessage(crossSwap);

          const multicallHandler = getMultiCallHandlerAddress(
            crossSwap.outputToken.chainId
          );
          expect(recipient).toBe(multicallHandler);
          expect(message).toBeDefined();
          expect(message).not.toBe("");
          expect(message).not.toBe("0x");
        });

        test("should use MultiCallHandler for native output to EOA on Lens (exactInput)", async () => {
          const crossSwap = createMockCrossSwap({
            type: "exactInput",
            outputToken: {
              address: TOKEN_SYMBOLS_MAP.GHO.addresses[CHAIN_IDs.LENS],
              decimals: 18,
              symbol: "GHO",
              chainId: CHAIN_IDs.LENS,
            },
            recipient: MOCK_EOA_ADDRESS,
            isOutputNative: true,
          });
          const recipient = await getBridgeQuoteRecipient(crossSwap, false);
          const message = await getBridgeQuoteMessage(crossSwap);

          const multicallHandler = getMultiCallHandlerAddress(
            crossSwap.outputToken.chainId
          );
          expect(recipient).toBe(multicallHandler);
          expect(message).toBeDefined();
          expect(message).not.toBe("");
          expect(message).not.toBe("0x");
        });

        test("should bypass for regular ERC-20 to EOA on Lens (minOutput)", async () => {
          const crossSwap = createMockCrossSwap({
            type: "minOutput",
            outputToken: {
              address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.LENS],
              decimals: 6,
              symbol: "USDC",
              chainId: CHAIN_IDs.LENS,
            },
            recipient: MOCK_EOA_ADDRESS,
            isOutputNative: false,
          });
          const recipient = await getBridgeQuoteRecipient(crossSwap, false);
          const message = await getBridgeQuoteMessage(crossSwap);

          expect(recipient).toBe(crossSwap.recipient);
          expect(message).toBeUndefined();
        });
      });
    });
  });

  describe("#getQuoteFetchStrategies()", () => {
    const createMockStrategy = (name: string): QuoteFetchStrategy => ({
      strategyName: name,
      getRouter: vi.fn(),
      getOriginEntryPoints: vi.fn(),
      fetchFn: vi.fn(),
      getSources: vi.fn(),
      assertSellEntireBalanceSupported: vi.fn(),
    });

    const defaultStrategy = createMockStrategy("default-strategy");
    const chainStrategy = createMockStrategy("chain-strategy");
    const inputTokenStrategy = createMockStrategy("input-token-strategy");
    const exactPairStrategy = createMockStrategy("exact-pair-strategy");

    test("should return exact pair match with highest priority", () => {
      const strategies: QuoteFetchStrategies = {
        default: [defaultStrategy],
        chains: {
          [CHAIN_IDs.MAINNET]: [chainStrategy],
        },
        inputTokens: {
          GHO: [inputTokenStrategy],
        },
        swapPairs: {
          [CHAIN_IDs.MAINNET]: {
            GHO: {
              WGHO: [exactPairStrategy],
            },
          },
        },
      };

      const result = getQuoteFetchStrategies(
        CHAIN_IDs.MAINNET,
        "GHO",
        "WGHO",
        strategies,
        "origin"
      );

      expect(result).toEqual([exactPairStrategy]);
    });

    test("should fallback to chain strategy when no swapPairs match", () => {
      const strategies: QuoteFetchStrategies = {
        default: [defaultStrategy],
        chains: {
          [CHAIN_IDs.MAINNET]: [chainStrategy],
        },
        inputTokens: {
          GHO: [inputTokenStrategy],
        },
        swapPairs: {
          [CHAIN_IDs.MAINNET]: {
            DAI: {
              USDC: [exactPairStrategy],
            },
          },
        },
      };

      const result = getQuoteFetchStrategies(
        CHAIN_IDs.MAINNET,
        "WETH",
        "USDC",
        strategies,
        "origin"
      );

      expect(result).toEqual([chainStrategy]);
    });

    test("should fallback to inputTokens strategy when no swapPairs or chain match", () => {
      const strategies: QuoteFetchStrategies = {
        default: [defaultStrategy],
        inputTokens: {
          DAI: [inputTokenStrategy],
        },
        swapPairs: {
          [CHAIN_IDs.MAINNET]: {
            GHO: {
              WGHO: [exactPairStrategy],
            },
          },
        },
      };

      const result = getQuoteFetchStrategies(
        CHAIN_IDs.ARBITRUM,
        "DAI",
        "USDC",
        strategies,
        "origin"
      );

      expect(result).toEqual([inputTokenStrategy]);
    });

    test("should fallback to default strategy when nothing matches", () => {
      const strategies: QuoteFetchStrategies = {
        default: [defaultStrategy],
        inputTokens: {
          DAI: [inputTokenStrategy],
        },
      };

      const result = getQuoteFetchStrategies(
        CHAIN_IDs.ARBITRUM,
        "WETH",
        "USDC",
        strategies,
        "origin"
      );

      expect(result).toEqual([defaultStrategy]);
    });

    test("should respect lookup hierarchy: swapPairs > chains > inputTokens > default", () => {
      const strategies: QuoteFetchStrategies = {
        default: [defaultStrategy],
        chains: {
          [CHAIN_IDs.MAINNET]: [chainStrategy],
        },
        inputTokens: {
          GHO: [inputTokenStrategy],
        },
        swapPairs: {
          [CHAIN_IDs.MAINNET]: {
            GHO: {
              WGHO: [exactPairStrategy],
            },
          },
        },
      };

      const exactPairResult = getQuoteFetchStrategies(
        CHAIN_IDs.MAINNET,
        "GHO",
        "WGHO",
        strategies,
        "origin"
      );
      expect(exactPairResult).toEqual([exactPairStrategy]);

      const chainResult = getQuoteFetchStrategies(
        CHAIN_IDs.MAINNET,
        "WETH",
        "USDC",
        strategies,
        "origin"
      );
      expect(chainResult).toEqual([chainStrategy]);

      const inputTokenResult = getQuoteFetchStrategies(
        CHAIN_IDs.ARBITRUM,
        "GHO",
        "USDC",
        strategies,
        "origin"
      );
      expect(inputTokenResult).toEqual([inputTokenStrategy]);

      const defaultResult = getQuoteFetchStrategies(
        CHAIN_IDs.ARBITRUM,
        "WETH",
        "USDC",
        strategies,
        "origin"
      );
      expect(defaultResult).toEqual([defaultStrategy]);
    });

    test("should return hardcoded fallback when no strategies provided", () => {
      const strategies: QuoteFetchStrategies = {};

      const result = getQuoteFetchStrategies(
        CHAIN_IDs.MAINNET,
        "WETH",
        "USDC",
        strategies,
        "origin"
      );

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("#getAcrossFallbackRecipient()", () => {
    test("should return refundAddress when refundOnOrigin=false and refundAddress is set", () => {
      const refundAddress = "0xRefundAddress00000000000000000000000000000";
      const crossSwap = createMockCrossSwap({
        refundOnOrigin: false,
        refundAddress,
      });
      const result = getAcrossFallbackRecipient(crossSwap);
      expect(result).toBe(refundAddress);
    });

    test("should fallback to destinationRecipient when refundOnOrigin=false and no refundAddress", () => {
      const destinationRecipient =
        "0xDestinationRecipient0000000000000000000000";
      const crossSwap = createMockCrossSwap({
        refundOnOrigin: false,
        refundAddress: undefined,
      });
      const result = getAcrossFallbackRecipient(
        crossSwap,
        destinationRecipient
      );
      expect(result).toBe(destinationRecipient);
    });

    test("should fallback to depositor when refundOnOrigin=false and no refundAddress or destinationRecipient", () => {
      const crossSwap = createMockCrossSwap({
        refundOnOrigin: false,
        refundAddress: undefined,
      });
      const result = getAcrossFallbackRecipient(crossSwap);
      expect(result).toBe(crossSwap.depositor);
    });

    test("should prefer refundAddress over destinationRecipient when both are provided", () => {
      const refundAddress = "0xRefundAddress00000000000000000000000000000";
      const destinationRecipient =
        "0xDestinationRecipient0000000000000000000000";
      const crossSwap = createMockCrossSwap({
        refundOnOrigin: false,
        refundAddress,
      });
      const result = getAcrossFallbackRecipient(
        crossSwap,
        destinationRecipient
      );
      expect(result).toBe(refundAddress);
    });

    test("should always return AddressZero when refundOnOrigin=true, regardless of other params", () => {
      const refundAddress = "0xRefundAddress00000000000000000000000000000";
      const destinationRecipient =
        "0xDestinationRecipient0000000000000000000000";
      const crossSwap = createMockCrossSwap({
        refundOnOrigin: true,
        refundAddress,
      });
      const result = getAcrossFallbackRecipient(
        crossSwap,
        destinationRecipient
      );
      expect(result).toBe(constants.AddressZero);
    });
  });

  describe("#getMintBurnRefundRecipient()", () => {
    test("should return refundAddress when set", () => {
      const refundAddress = "0xRefundAddress00000000000000000000000000000";
      const crossSwap = createMockCrossSwap({ refundAddress });
      const result = getMintBurnRefundRecipient(crossSwap);
      expect(result).toBe(refundAddress);
    });

    test("should fallback to defaultRecipient when no refundAddress", () => {
      const defaultRecipient = "0xDefaultRecipient0000000000000000000000000";
      const crossSwap = createMockCrossSwap({ refundAddress: undefined });
      const result = getMintBurnRefundRecipient(crossSwap, defaultRecipient);
      expect(result).toBe(defaultRecipient);
    });

    test("should fallback to depositor when no refundAddress or defaultRecipient", () => {
      const crossSwap = createMockCrossSwap({ refundAddress: undefined });
      const result = getMintBurnRefundRecipient(crossSwap);
      expect(result).toBe(crossSwap.depositor);
    });

    test("should prefer refundAddress over defaultRecipient when both are provided", () => {
      const refundAddress = "0xRefundAddress00000000000000000000000000000";
      const defaultRecipient = "0xDefaultRecipient0000000000000000000000000";
      const crossSwap = createMockCrossSwap({ refundAddress });
      const result = getMintBurnRefundRecipient(crossSwap, defaultRecipient);
      expect(result).toBe(refundAddress);
    });
  });
});
