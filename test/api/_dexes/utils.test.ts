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

// Mock addresses for testing EOA vs Contract behavior
const MOCK_EOA_ADDRESS = "0xEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE";
const MOCK_CONTRACT_ADDRESS = "0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC";

// Mock isContractCache to control EOA vs Contract detection
jest.mock("../../../api/_utils", () => ({
  ...jest.requireActual("../../../api/_utils"),
  isContractCache: jest.fn((_chainId: number, address: string) => {
    const isContract =
      address.toLowerCase() === MOCK_CONTRACT_ADDRESS.toLowerCase();
    return {
      get: jest.fn(() => Promise.resolve(isContract)),
    };
  }),
}));

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

    describe("Bypass MultiCallHandler conditions", () => {
      test("should bypass for simple B2B with exactInput", async () => {
        const crossSwap = createMockCrossSwap({ type: "exactInput" });
        const recipient = await getBridgeQuoteRecipient(crossSwap, false);
        const message = await getBridgeQuoteMessage(crossSwap);

        expect(recipient).toBe(crossSwap.recipient);
        expect(message).toBeUndefined();
      });

      test("should bypass for simple B2B with minOutput", async () => {
        const crossSwap = createMockCrossSwap({ type: "minOutput" });
        const recipient = await getBridgeQuoteRecipient(crossSwap, false);
        const message = await getBridgeQuoteMessage(crossSwap);

        expect(recipient).toBe(crossSwap.recipient);
        expect(message).toBeUndefined();
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

      test("should use MultiCallHandler for exactOutput (even without other features)", async () => {
        const crossSwap = createMockCrossSwap({
          type: "exactOutput",
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

      test("should use MultiCallHandler for exactOutput with refundAddress", async () => {
        const crossSwap = createMockCrossSwap({
          type: "exactOutput",
          refundAddress: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
        });
        const message = await getBridgeQuoteMessage(crossSwap);

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
});
