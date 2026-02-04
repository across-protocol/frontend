import { describe, test, expect, vi, beforeEach } from "vitest";
import { BigNumber } from "ethers";

import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../../../../api/_constants";
import type {
  CrossSwapQuotes,
  DepositEntryPointContract,
} from "../../../../../api/_dexes/types";

// Mock dependencies
vi.mock("../../../../../api/_transfer-with-auth", () => ({
  getReceiveWithAuthTypedData: vi.fn().mockResolvedValue({
    eip712: {
      domain: {},
      types: {},
      primaryType: "ReceiveWithAuthorization",
      message: {},
    },
    domainSeparator: "0xmockedDomainSeparator",
  }),
}));

vi.mock("../../../../../api/_spoke-pool-periphery", () => ({
  getDeterministicDepositId: vi.fn().mockReturnValue("0xmockedDepositId"),
  getSpokePoolPeriphery: vi.fn().mockReturnValue({
    AUTHORIZATION_NONCE_IDENTIFIER: vi
      .fn()
      .mockResolvedValue("0xmockedAuthorizationNonceIdentifier"),
    getDepositId: vi.fn().mockResolvedValue("0xmockedDepositId"),
    getERC3009DepositWitness: vi.fn().mockResolvedValue("0xmockedWitnessHash"),
    getERC3009SwapAndBridgeWitness: vi
      .fn()
      .mockResolvedValue("0xmockedSwapWitnessHash"),
  }),
  TransferType: {
    Approval: 0,
    Transfer: 1,
    Permit2Approval: 2,
  },
}));

vi.mock("../../../../../api/_dexes/utils", () => ({
  extractDepositDataStruct: vi.fn().mockResolvedValue({
    inputAmount: BigNumber.from(100),
    baseDepositData: {
      depositor: "0xdepositor",
      recipient: "0xrecipient",
      inputToken: "0xinputToken",
      outputToken: "0xoutputToken",
      inputAmount: BigNumber.from(100),
      outputAmount: BigNumber.from(100),
      destinationChainId: 42161,
      exclusiveRelayer: "0x",
      quoteTimestamp: 0,
      fillDeadline: 0,
      exclusivityDeadline: 0,
      exclusivityParameter: 0,
      message: "0x",
    },
    submissionFees: { amount: BigNumber.from(0), recipient: "0x" },
  }),
  extractSwapAndDepositDataStruct: vi.fn().mockResolvedValue({
    submissionFees: { amount: BigNumber.from(0), recipient: "0x" },
    depositData: {
      depositor: "0xdepositor",
      recipient: "0xrecipient",
      inputToken: "0xinputToken",
      outputToken: "0xoutputToken",
      inputAmount: BigNumber.from(100),
      outputAmount: BigNumber.from(100),
      destinationChainId: 42161,
      exclusiveRelayer: "0x",
      quoteTimestamp: 0,
      fillDeadline: 0,
      exclusivityDeadline: 0,
      exclusivityParameter: 0,
      message: "0x",
    },
    swapToken: "0xswapToken",
    exchange: "0xexchange",
    transferType: 1,
    swapTokenAmount: BigNumber.from(100),
    minExpectedInputTokenAmount: BigNumber.from(90),
    routerCalldata: "0x",
    spokePool: "0xspokePool",
  }),
}));

vi.mock("../../../../../api/_utils", () => ({
  getSpokePoolAddress: vi.fn().mockReturnValue("0xMockedSpokePoolAddress"),
}));

// Import after mocks
import { buildErc3009Tx } from "../../../../../api/_bridges/across/utils/erc3009-tx-builder";

describe("_bridges/across/utils/erc3009-tx-builder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("buildErc3009Tx", () => {
    const mockDepositEntryPoint = {
      name: "SpokePoolPeriphery",
      address: "0xSpokePoolPeripheryAddress",
    } as const;

    const mockOriginSwapEntryPoint = {
      name: "SpokePoolPeriphery",
      address: "0xOriginSwapEntryPointAddress",
    } as const;

    const baseQuotes: CrossSwapQuotes = {
      crossSwap: {
        amount: BigNumber.from("1000000"),
        inputToken: {
          address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.MAINNET],
          decimals: 6,
          symbol: "USDC",
          chainId: CHAIN_IDs.MAINNET,
        },
        outputToken: {
          address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.ARBITRUM],
          decimals: 6,
          symbol: "USDC",
          chainId: CHAIN_IDs.ARBITRUM,
        },
        depositor: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
        recipient: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
        slippageTolerance: 0.01,
        type: "exactInput",
        refundOnOrigin: true,
        embeddedActions: [],
        strictTradeType: true,
      },
      bridgeQuote: {
        inputAmount: BigNumber.from("1000000"),
        outputAmount: BigNumber.from("990000"),
        minOutputAmount: BigNumber.from("985000"),
        inputToken: {
          address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.MAINNET],
          decimals: 6,
          symbol: "USDC",
          chainId: CHAIN_IDs.MAINNET,
        },
        outputToken: {
          address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.ARBITRUM],
          decimals: 6,
          symbol: "USDC",
          chainId: CHAIN_IDs.ARBITRUM,
        },
        estimatedFillTimeSec: 60,
        provider: "across",
        fees: {
          amount: BigNumber.from("10000"),
          pct: BigNumber.from("100"),
          token: {
            address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.MAINNET],
            decimals: 6,
            symbol: "USDC",
            chainId: CHAIN_IDs.MAINNET,
          },
        },
      } as CrossSwapQuotes["bridgeQuote"],
      contracts: {
        depositEntryPoint: mockDepositEntryPoint,
      },
    };

    test("should build gasless tx for bridge-only quote (no origin swap)", async () => {
      const result = await buildErc3009Tx({
        quotes: baseQuotes,
        validAfter: 0,
        validBefore: 9999999999,
      });

      expect(result.ecosystem).toBe("evm-gasless");
      expect(result.isGasless).toBe(true);
      expect(result.chainId).toBe(CHAIN_IDs.MAINNET);
      expect(result.to).toBe(mockDepositEntryPoint.address);
      expect(result.data.type).toBe("erc3009");
      expect(result.data.depositId).toBe("0xmockedDepositId");
      expect(result.data.witness.type).toBe("BridgeWitness");
    });

    test("should build gasless tx for origin swap quote", async () => {
      const quotesWithOriginSwap: CrossSwapQuotes = {
        ...baseQuotes,
        originSwapQuote: {
          tokenIn: {
            address: "0xTokenIn",
            decimals: 18,
            symbol: "WETH",
            chainId: CHAIN_IDs.MAINNET,
          },
          tokenOut: {
            address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.MAINNET],
            decimals: 6,
            symbol: "USDC",
            chainId: CHAIN_IDs.MAINNET,
          },
          expectedAmountIn: BigNumber.from("500000000000000000"),
          maximumAmountIn: BigNumber.from("510000000000000000"),
          expectedAmountOut: BigNumber.from("1000000"),
          minAmountOut: BigNumber.from("990000"),
          slippageTolerance: 0.01,
        } as CrossSwapQuotes["originSwapQuote"],
        contracts: {
          ...baseQuotes.contracts,
          originSwapEntryPoint: mockOriginSwapEntryPoint,
          originRouter: {
            name: "Router",
            address: "0xRouterAddress",
            transferType: 1,
          },
        },
      };

      const result = await buildErc3009Tx({
        quotes: quotesWithOriginSwap,
        validAfter: 0,
        validBefore: 9999999999,
      });

      expect(result.ecosystem).toBe("evm-gasless");
      expect(result.isGasless).toBe(true);
      expect(result.to).toBe(mockOriginSwapEntryPoint.address);
      expect(result.data.witness.type).toBe("BridgeAndSwapWitness");
    });

    test("should throw if depositEntryPoint is not defined for bridge quote", async () => {
      const quotesWithoutEntryPoint: CrossSwapQuotes = {
        ...baseQuotes,
        contracts: {
          depositEntryPoint: undefined as unknown as DepositEntryPointContract,
        },
      };

      await expect(
        buildErc3009Tx({
          quotes: quotesWithoutEntryPoint,
          validAfter: 0,
          validBefore: 9999999999,
        })
      ).rejects.toThrow("'depositEntryPoint' needs to be defined");
    });

    test("should throw if depositEntryPoint is not SpokePoolPeriphery", async () => {
      const quotesWithWrongEntryPoint: CrossSwapQuotes = {
        ...baseQuotes,
        contracts: {
          depositEntryPoint: {
            name: "SpokePool",
            address: "0xSomeAddress",
          },
        },
      };

      await expect(
        buildErc3009Tx({
          quotes: quotesWithWrongEntryPoint,
          validAfter: 0,
          validBefore: 9999999999,
        })
      ).rejects.toThrow("auth is not supported for deposit entry point");
    });

    test("should throw if originSwapEntryPoint is not defined for origin swap quote", async () => {
      const quotesWithOriginSwapNoEntryPoint: CrossSwapQuotes = {
        ...baseQuotes,
        originSwapQuote: {
          tokenIn: {
            address: "0xTokenIn",
            decimals: 18,
            symbol: "WETH",
            chainId: CHAIN_IDs.MAINNET,
          },
          tokenOut: {
            address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.MAINNET],
            decimals: 6,
            symbol: "USDC",
            chainId: CHAIN_IDs.MAINNET,
          },
          expectedAmountIn: BigNumber.from("500000000000000000"),
          maximumAmountIn: BigNumber.from("510000000000000000"),
          expectedAmountOut: BigNumber.from("1000000"),
          minAmountOut: BigNumber.from("990000"),
          slippageTolerance: 0.01,
        } as CrossSwapQuotes["originSwapQuote"],
        contracts: {
          depositEntryPoint: mockDepositEntryPoint,
          originSwapEntryPoint: undefined,
        },
      };

      await expect(
        buildErc3009Tx({
          quotes: quotesWithOriginSwapNoEntryPoint,
          validAfter: 0,
          validBefore: 9999999999,
        })
      ).rejects.toThrow("'originSwapEntryPoint' needs to be defined");
    });

    test("should include integratorId in result when provided", async () => {
      const result = await buildErc3009Tx({
        quotes: baseQuotes,
        integratorId: "test-integrator",
        validAfter: 0,
        validBefore: 9999999999,
      });

      expect(result.data.integratorId).toBe("test-integrator");
    });
  });
});
