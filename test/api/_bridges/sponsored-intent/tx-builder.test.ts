import { BigNumber } from "ethers";
import {
  buildTxEvm,
  buildTxSvm,
} from "../../../../api/_bridges/sponsored-intent/utils/tx-builder";
import { getSpokePool } from "../../../../api/_spoke-pool";
import { getSVMRpc } from "../../../../api/_providers";
import { CHAIN_IDs } from "../../../../api/_constants";
import { CrossSwapQuotes } from "../../../../api/_dexes/types";

jest.mock("../../../../api/_spoke-pool");
jest.mock("../../../../api/_providers");

jest.mock("@across-protocol/sdk", () => {
  const actual = jest.requireActual("@across-protocol/sdk");
  return {
    ...actual,
    arch: {
      ...actual.arch,
      svm: {
        getDepositDelegatePda: jest.fn(),
        getStatePda: jest.fn(),
        getEventAuthority: jest.fn(),
        getAssociatedTokenAddress: jest.fn(),
        createDepositInstruction: jest
          .fn()
          .mockResolvedValue({ instructions: [] }),
        createDefaultTransaction: jest.fn().mockResolvedValue({}),
        bigToU8a32: jest.fn(),
      },
    },
    utils: {
      ...actual.utils,
      getCurrentTime: jest.fn().mockReturnValue(1000000),
      toAddressType: jest.fn((addr) => ({
        toBytes32: () => "0xBytes32",
        toBase58: () => addr,
        forceSvmAddress: () => addr,
      })),
    },
  };
});

jest.mock("@solana-program/memo", () => ({
  getAddMemoInstruction: jest.fn().mockReturnValue({}),
}));
jest.mock("@solana/transaction-messages", () => ({
  appendTransactionMessageInstruction: jest.fn().mockReturnValue({}),
}));
jest.mock("@solana/kit", () => ({
  address: jest.fn().mockReturnValue("address"),
  compileTransaction: jest.fn(),
  createNoopSigner: jest.fn(),
  getBase64EncodedWireTransaction: jest.fn().mockReturnValue("encodedTx"),
  pipe: jest.fn((val) => val),
}));

describe("Tx Builder", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("buildTxEvm", () => {
    it("should build EVM transaction", async () => {
      const spokePoolMock = {
        address: "0xSpokePool",
        populateTransaction: {
          deposit: jest.fn().mockResolvedValue({ data: "0xdeadbeef" }),
        },
      };
      (getSpokePool as jest.Mock).mockReturnValue(spokePoolMock);

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
      (getSVMRpc as jest.Mock).mockReturnValue({});

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
