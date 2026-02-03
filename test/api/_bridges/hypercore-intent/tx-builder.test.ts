import { beforeEach, describe, expect, it, vi } from "vitest";
import { BigNumber } from "ethers";
import {
  buildTxEvm,
  buildTxSvm,
} from "../../../../api/_bridges/hypercore-intent/utils/tx-builder";
import { getSpokePool } from "../../../../api/_spoke-pool";
import {
  getSpokePoolPeriphery,
  getSpokePoolPeripheryAddress,
} from "../../../../api/_spoke-pool-periphery";
import { getSVMRpc } from "../../../../api/_providers";
import { CrossSwapQuotes } from "../../../../api/_dexes/types";
import {
  USDC_ON_OPTIMISM,
  USDH_ON_HYPEREVM,
  USDC_ON_SOLANA,
  DAI_ON_POLYGON,
  USDT_ON_POLYGON,
  USDT_SPOT_ON_HYPERCORE,
  SOL_ON_SOLANA,
} from "./utils";

vi.mock("../../../../api/_spoke-pool");
vi.mock("../../../../api/_spoke-pool-periphery");
vi.mock("../../../../api/_providers");

vi.mock("@across-protocol/sdk", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@across-protocol/sdk")>();
  return {
    ...actual,
    arch: {
      ...actual.arch,
      svm: {
        getDepositDelegatePda: vi.fn(),
        getStatePda: vi.fn(),
        getEventAuthority: vi.fn(),
        getAssociatedTokenAddress: vi.fn(),
        createDepositInstruction: vi
          .fn()
          .mockResolvedValue({ instructions: [] }),
        createDefaultTransaction: vi.fn().mockResolvedValue({}),
        bigToU8a32: vi.fn(),
      },
    },
    utils: {
      ...actual.utils,
      getCurrentTime: vi.fn().mockReturnValue(1000000),
      toAddressType: vi.fn((addr) => ({
        toBytes32: () => "0xBytes32",
        toBase58: () => addr,
        forceSvmAddress: () => addr,
        toEvmAddress: () => addr,
      })),
    },
  };
});

vi.mock("@solana-program/memo", () => ({
  getAddMemoInstruction: vi.fn().mockReturnValue({}),
}));
vi.mock("@solana/transaction-messages", () => ({
  appendTransactionMessageInstruction: vi.fn().mockReturnValue({}),
}));
vi.mock("@solana/kit", () => ({
  address: vi.fn().mockReturnValue("address"),
  compileTransaction: vi.fn(),
  createNoopSigner: vi.fn(),
  getBase64EncodedWireTransaction: vi.fn().mockReturnValue("encodedTx"),
  pipe: vi.fn((val) => val),
}));

describe("Tx Builder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("buildTxEvm", () => {
    it("should build EVM transaction", async () => {
      const spokePoolMock = {
        address: "0xSpokePool",
        populateTransaction: {
          deposit: vi.fn().mockResolvedValue({ data: "0xdeadbeef" }),
        },
      };
      (getSpokePool as ReturnType<typeof vi.fn>).mockReturnValue(spokePoolMock);

      const quotes = {
        crossSwap: {
          inputToken: USDC_ON_OPTIMISM,
          outputToken: USDH_ON_HYPEREVM,
          depositor: "0xDepositor",
          recipient: "0xRecipient",
        },
        bridgeQuote: {
          inputAmount: BigNumber.from("100"),
          outputAmount: BigNumber.from("100"),
          message: "0x",
        },
        originSwapQuote: undefined,
        destinationSwapQuote: undefined,
        appFee: undefined,
      } as unknown as CrossSwapQuotes;

      const result = await buildTxEvm({ quotes });

      expect(result.to).toBe("0xSpokePool");
      expect(result.data).toContain("0xdeadbeef");
      expect(spokePoolMock.populateTransaction.deposit).toHaveBeenCalled();
    });
  });

  describe("buildTxSvm", () => {
    it("should build SVM transaction", async () => {
      (getSVMRpc as ReturnType<typeof vi.fn>).mockReturnValue({});

      const quotes = {
        crossSwap: {
          inputToken: USDC_ON_SOLANA,
          outputToken: USDH_ON_HYPEREVM,
          depositor: "SolanaDepositor",
          recipient: "0xRecipient",
          isOriginSvm: true,
        },
        bridgeQuote: {
          inputAmount: BigNumber.from("100"),
          outputAmount: BigNumber.from("100"),
          message: "0x",
        },
        originSwapQuote: undefined,
        destinationSwapQuote: undefined,
        appFee: undefined,
      } as unknown as CrossSwapQuotes;

      const result = await buildTxSvm({ quotes });

      expect(result.data).toBe("encodedTx");
      expect(result.ecosystem).toBe("svm");
    });
  });

  describe("buildTxEvm with origin swap", () => {
    it("should allow origin swap on EVM chains", async () => {
      const spokePoolMock = {
        address: "0xSpokePool",
        populateTransaction: {
          deposit: vi.fn().mockResolvedValue({ data: "0xdeadbeef" }),
        },
      };
      const spokePoolPeripheryMock = {
        address: "0xSpokePoolPeriphery",
        populateTransaction: {
          swapAndBridge: vi.fn().mockResolvedValue({ data: "0xdeadbeef" }),
        },
      };
      (getSpokePool as ReturnType<typeof vi.fn>).mockReturnValue(spokePoolMock);
      (getSpokePoolPeriphery as ReturnType<typeof vi.fn>).mockReturnValue(
        spokePoolPeripheryMock
      );
      (
        getSpokePoolPeripheryAddress as unknown as ReturnType<typeof vi.fn>
      ).mockReturnValue("0xSpokePoolPeriphery");

      const quotes = {
        crossSwap: {
          inputToken: DAI_ON_POLYGON,
          outputToken: USDT_SPOT_ON_HYPERCORE,
          depositor: "0xDepositor",
          recipient: "0xRecipient",
          isOriginSvm: false,
          isInputNative: false,
        },
        bridgeQuote: {
          inputToken: USDT_ON_POLYGON,
          outputToken: USDT_SPOT_ON_HYPERCORE,
          inputAmount: BigNumber.from("1000000"),
          outputAmount: BigNumber.from("100000000"),
          message: "0xabcd",
        },
        originSwapQuote: {
          tokenIn: DAI_ON_POLYGON,
          tokenOut: USDT_ON_POLYGON,
          maximumAmountIn: BigNumber.from("1000000000000000000"),
          minAmountOut: BigNumber.from("990000"),
          expectedAmountOut: BigNumber.from("1000000"),
          swapTxns: [
            {
              ecosystem: "evm",
              data: "0xswapdata",
            },
          ],
        },
        contracts: {
          originRouter: {
            address: "0xDEXRouter",
            name: "DEX Router",
          },
        },
        destinationSwapQuote: undefined,
        appFee: undefined,
      } as unknown as CrossSwapQuotes;

      const result = await buildTxEvm({ quotes });

      expect(result.to).toBeDefined();
      expect(result.data).toBeDefined();
      expect(spokePoolMock.populateTransaction.deposit).not.toHaveBeenCalled();
    });
  });

  describe("buildTxEvm with destination swap", () => {
    it("should reject destination swap", async () => {
      const quotes = {
        crossSwap: {
          inputToken: USDT_ON_POLYGON,
          outputToken: USDT_SPOT_ON_HYPERCORE,
          depositor: "0xDepositor",
          recipient: "0xRecipient",
          isOriginSvm: false,
        },
        bridgeQuote: {
          inputAmount: BigNumber.from("1000000"),
          outputAmount: BigNumber.from("100000000"),
          message: "0x",
        },
        originSwapQuote: undefined,
        destinationSwapQuote: {
          tokenIn: USDT_ON_POLYGON,
          tokenOut: DAI_ON_POLYGON,
          minAmountOut: BigNumber.from("1000000000000000000"),
        },
        appFee: undefined,
      } as unknown as CrossSwapQuotes;

      await expect(buildTxEvm({ quotes })).rejects.toThrow(
        "Destination swap is not supported"
      );
    });
  });

  describe("buildTxSvm with origin swap", () => {
    it("should reject origin swap on SVM chains", async () => {
      (getSVMRpc as ReturnType<typeof vi.fn>).mockReturnValue({});

      const quotes = {
        crossSwap: {
          inputToken: SOL_ON_SOLANA,
          outputToken: USDT_SPOT_ON_HYPERCORE,
          depositor: "SolanaDepositor",
          recipient: "0xRecipient",
          isOriginSvm: true,
        },
        bridgeQuote: {
          inputAmount: BigNumber.from("1000000000"),
          outputAmount: BigNumber.from("100000000"),
          message: "0x",
        },
        originSwapQuote: {
          tokenIn: SOL_ON_SOLANA,
          tokenOut: USDC_ON_SOLANA,
          minAmountOut: BigNumber.from("990000"),
        },
        destinationSwapQuote: undefined,
        appFee: undefined,
      } as unknown as CrossSwapQuotes;

      await expect(buildTxSvm({ quotes })).rejects.toThrow(
        "Origin swap is not supported"
      );
    });
  });
});
