import { BigNumber } from "ethers";
import {
  getCrossSwapTypes,
  CROSS_SWAP_TYPE,
  getBridgeQuoteRecipient,
  getBridgeQuoteMessage,
} from "../../../api/_dexes/utils";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../../api/_constants";
import { CrossSwap } from "../../../api/_dexes/types";
import { getMultiCallHandlerAddress } from "../../../api/_multicall-handler";

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
    const createMockCrossSwap = (
      overrides?: Partial<CrossSwap>
    ): CrossSwap => ({
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
      depositor: "0x1234567890123456789012345678901234567890",
      recipient: "0x0987654321098765432109876543210987654321",
      slippageTolerance: 0.5,
      type: "exactInput",
      refundOnOrigin: false,
      embeddedActions: [],
      strictTradeType: false,
      ...overrides,
    });

    describe("getBridgeQuoteRecipient() behavior", () => {
      test("should return recipient directly for simple B2B", () => {
        const crossSwap = createMockCrossSwap();
        const recipient = getBridgeQuoteRecipient(crossSwap, false);
        expect(recipient).toBe(crossSwap.recipient);
      });

      test("should return MultiCallHandler for A2B (has origin swap)", () => {
        const crossSwap = createMockCrossSwap();
        const recipient = getBridgeQuoteRecipient(crossSwap, true);
        const multicallHandler = getMultiCallHandlerAddress(
          crossSwap.outputToken.chainId
        );
        expect(recipient).not.toBe(crossSwap.recipient);
        expect(recipient).toBe(multicallHandler);
      });

      test("should return MultiCallHandler for B2B with app fees", () => {
        const crossSwap = createMockCrossSwap({
          appFeePercent: 0.01,
          appFeeRecipient: "0xFEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
        });
        const recipient = getBridgeQuoteRecipient(crossSwap, false);
        const multicallHandler = getMultiCallHandlerAddress(
          crossSwap.outputToken.chainId
        );
        expect(recipient).not.toBe(crossSwap.recipient);
        expect(recipient).toBe(multicallHandler);
      });

      test("should return MultiCallHandler for B2B with native output", () => {
        const crossSwap = createMockCrossSwap({
          isOutputNative: true,
        });
        const recipient = getBridgeQuoteRecipient(crossSwap, false);
        const multicallHandler = getMultiCallHandlerAddress(
          crossSwap.outputToken.chainId
        );
        expect(recipient).not.toBe(crossSwap.recipient);
        expect(recipient).toBe(multicallHandler);
      });

      test("should return MultiCallHandler for B2B with embedded actions", () => {
        const crossSwap = createMockCrossSwap({
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
        const recipient = getBridgeQuoteRecipient(crossSwap, false);
        const multicallHandler = getMultiCallHandlerAddress(
          crossSwap.outputToken.chainId
        );
        expect(recipient).not.toBe(crossSwap.recipient);
        expect(recipient).toBe(multicallHandler);
      });
    });

    describe("Simple B2B bridge (message bypasses MultiCallHandler)", () => {
      test("should return undefined message for exactInput (no app fees, native output, or actions)", () => {
        const crossSwap = createMockCrossSwap({
          type: "exactInput",
        });
        const message = getBridgeQuoteMessage(crossSwap);
        expect(message).toBeUndefined();
      });

      test("should return undefined message for minOutput (no app fees, native output, or actions)", () => {
        const crossSwap = createMockCrossSwap({
          type: "minOutput",
        });
        const message = getBridgeQuoteMessage(crossSwap);
        expect(message).toBeUndefined();
      });

      test("should bypass for regular ERC-20 to ERC-20 (not native or wrapped native)", () => {
        const crossSwap = createMockCrossSwap({
          type: "exactInput",
          inputToken: {
            address: TOKEN_SYMBOLS_MAP.DAI.addresses[CHAIN_IDs.OPTIMISM],
            decimals: 18,
            symbol: "DAI",
            chainId: CHAIN_IDs.OPTIMISM,
          },
          outputToken: {
            address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.ARBITRUM],
            decimals: 6,
            symbol: "USDC",
            chainId: CHAIN_IDs.ARBITRUM,
          },
          isOutputNative: false,
        });
        const recipient = getBridgeQuoteRecipient(crossSwap, false);
        const message = getBridgeQuoteMessage(crossSwap);

        expect(recipient).toBe(crossSwap.recipient);
        expect(message).toBeUndefined();
      });

      test("should return message for exactOutput (requires MultiCallHandler even without app fees)", () => {
        const crossSwap = createMockCrossSwap({
          type: "exactOutput",
        });
        const message = getBridgeQuoteMessage(crossSwap);
        expect(message).toBeDefined();
        expect(message).not.toBe("");
        expect(message).not.toBe("0x");
      });

      test("should bypass MultiCallHandler for exactInput with zero app fees", () => {
        const crossSwap = createMockCrossSwap({
          type: "exactInput",
          appFeePercent: 0,
          appFeeRecipient: "0xFEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
        });
        const recipient = getBridgeQuoteRecipient(crossSwap, false);
        const message = getBridgeQuoteMessage(crossSwap);

        // Should bypass MultiCallHandler when app fee is 0%
        expect(recipient).toBe(crossSwap.recipient);
        expect(message).toBeUndefined();
      });
    });

    describe("B2B bridge with special handling requirements (message uses MultiCallHandler)", () => {
      test("should return message when app fees specified", () => {
        const crossSwap = createMockCrossSwap({
          appFeePercent: 0.01,
          appFeeRecipient: "0xFEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
        });
        const message = getBridgeQuoteMessage(crossSwap);
        expect(message).toBeDefined();
        expect(message).not.toBe("");
        expect(message).not.toBe("0x");
      });

      test("should return message when output is native", () => {
        const crossSwap = createMockCrossSwap({
          isOutputNative: true,
        });
        const message = getBridgeQuoteMessage(crossSwap);
        expect(message).toBeDefined();
        expect(message).not.toBe("");
        expect(message).not.toBe("0x");
      });

      test("should return message when embedded actions specified", () => {
        const crossSwap = createMockCrossSwap({
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
        const message = getBridgeQuoteMessage(crossSwap);
        expect(message).toBeDefined();
        expect(message).not.toBe("");
        expect(message).not.toBe("0x");
      });

      test("should return message and MultiCallHandler for minOutput with native output", () => {
        const crossSwap = createMockCrossSwap({
          type: "minOutput",
          isOutputNative: true,
        });
        const recipient = getBridgeQuoteRecipient(crossSwap, false);
        const message = getBridgeQuoteMessage(crossSwap);

        const multicallHandler = getMultiCallHandlerAddress(
          crossSwap.outputToken.chainId
        );
        expect(recipient).toBe(multicallHandler);
        expect(message).toBeDefined();
        expect(message).not.toBe("");
        expect(message).not.toBe("0x");
      });

      test("should handle exactOutput with refundAddress", () => {
        const crossSwap = createMockCrossSwap({
          type: "exactOutput",
          refundAddress: "0xREFUNDADDRESS0000000000000000000000000",
        });
        const message = getBridgeQuoteMessage(crossSwap);

        expect(message).toBeDefined();
        expect(message).not.toBe("");
        expect(message).not.toBe("0x");
        // Message should be built successfully with refund address
      });

      test("should use MultiCallHandler for exactInput with wrapped native output", () => {
        const crossSwap = createMockCrossSwap({
          type: "exactInput",
          outputToken: {
            address: TOKEN_SYMBOLS_MAP.WETH.addresses[CHAIN_IDs.OPTIMISM],
            decimals: 18,
            symbol: "WETH",
            chainId: CHAIN_IDs.OPTIMISM,
          },
          isOutputNative: false,
        });
        const recipient = getBridgeQuoteRecipient(crossSwap, false);
        const message = getBridgeQuoteMessage(crossSwap);

        const multicallHandler = getMultiCallHandlerAddress(
          crossSwap.outputToken.chainId
        );
        expect(recipient).toBe(multicallHandler);
        expect(message).toBeDefined();
        expect(message).not.toBe("");
        expect(message).not.toBe("0x");
      });

      test("should use MultiCallHandler for minOutput with wrapped native output", () => {
        const crossSwap = createMockCrossSwap({
          type: "minOutput",
          outputToken: {
            address: TOKEN_SYMBOLS_MAP.WETH.addresses[CHAIN_IDs.BASE],
            decimals: 18,
            symbol: "WETH",
            chainId: CHAIN_IDs.BASE,
          },
          isOutputNative: false,
        });
        const recipient = getBridgeQuoteRecipient(crossSwap, false);
        const message = getBridgeQuoteMessage(crossSwap);

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

      test("should return message even without app fees when origin swap is involved", () => {
        const crossSwap = createMockCrossSwap();
        const message = getBridgeQuoteMessage(
          crossSwap,
          undefined,
          mockOriginSwapQuote
        );
        expect(message).toBeDefined();
        expect(message).not.toBe("");
        expect(message).not.toBe("0x");
      });

      test("should return message for A2B with exactInput", () => {
        const crossSwap = createMockCrossSwap({
          type: "exactInput",
        });
        const recipient = getBridgeQuoteRecipient(crossSwap, true);
        const message = getBridgeQuoteMessage(
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

      test("should return message for A2B with exactOutput", () => {
        const crossSwap = createMockCrossSwap({
          type: "exactOutput",
        });
        const recipient = getBridgeQuoteRecipient(crossSwap, true);
        const message = getBridgeQuoteMessage(
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

      test("should return message for A2B with minOutput", () => {
        const crossSwap = createMockCrossSwap({
          type: "minOutput",
        });
        const recipient = getBridgeQuoteRecipient(crossSwap, true);
        const message = getBridgeQuoteMessage(
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

    describe("SVM destinations (should always bypass MultiCallHandler)", () => {
      test("should return recipient directly for SVM destination", () => {
        const crossSwap = createMockCrossSwap({
          isDestinationSvm: true,
        });
        const recipient = getBridgeQuoteRecipient(crossSwap);
        expect(recipient).toBe(crossSwap.recipient);
      });

      test("should return undefined message for SVM destination", () => {
        const crossSwap = createMockCrossSwap({
          isDestinationSvm: true,
        });
        const message = getBridgeQuoteMessage(crossSwap);
        expect(message).toBeUndefined();
      });
    });
  });
});
