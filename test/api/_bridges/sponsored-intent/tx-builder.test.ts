import { vi } from "vitest";
import { BigNumber } from "ethers";
import {
  buildTxEvm,
  buildTxSvm,
} from "../../../../api/_bridges/sponsored-intent/utils/tx-builder";
import { getSpokePool } from "../../../../api/_spoke-pool";
import { getSVMRpc } from "../../../../api/_providers";
import { CHAIN_IDs } from "../../../../api/_constants";
import { CrossSwapQuotes } from "../../../../api/_dexes/types";

vi.mock("../../../../api/_spoke-pool");
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
          inputToken: {
            chainId: CHAIN_IDs.OPTIMISM,
            address: "0xInput",
            decimals: 6,
            symbol: "USDC",
          },
          outputToken: {
            chainId: CHAIN_IDs.HYPEREVM,
            address: "0xOutput",
            decimals: 6,
            symbol: "USDH",
          },
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
          inputToken: {
            chainId: CHAIN_IDs.SOLANA,
            address: "SolanaToken",
            decimals: 6,
            symbol: "USDC",
          },
          outputToken: {
            chainId: CHAIN_IDs.HYPEREVM,
            address: "0xOutput",
            decimals: 6,
            symbol: "USDH",
          },
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
});
