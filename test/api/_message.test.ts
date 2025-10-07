import * as sdk from "@across-protocol/sdk";
import { BigNumber } from "ethers";

import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../api/_constants";
import { validateDepositMessage } from "../../api/_message";
import { InvalidParamError } from "../../api/_errors";

// Mock dependencies
const mockIsContractCacheGet = jest.fn();

jest.mock("../../api/_cache", () => ({
  buildInternalCacheKey: jest.fn(),
  makeCacheGetterAndSetter: jest.fn(() => ({
    get: mockIsContractCacheGet,
  })),
}));

jest.mock("../../api/_providers", () => ({
  getProvider: jest.fn(),
}));

jest.mock("../../api/_balance", () => ({
  getCachedTokenBalance: jest.fn(),
}));

// Helper to create an encoded AcrossPlusMessage
function createEncodedMessage(
  handler: string,
  readOnlyLen: number,
  valueAmount: bigint,
  accounts: string[],
  handlerMessage: Uint8Array
): string {
  // Create the message object
  const message = {
    handler: sdk.utils.SvmAddress.from(handler).toBase58(),
    read_only_len: readOnlyLen,
    value_amount: valueAmount,
    accounts: accounts.map((addr) =>
      sdk.utils.SvmAddress.from(addr).toBase58()
    ),
    handler_message: handlerMessage,
  };

  const encoder = sdk.arch.svm.getAcrossPlusMessageEncoder();
  // @ts-expect-error - Type compatibility with @solana/kit Address type
  const encoded = encoder.encode(message);
  return "0x" + Buffer.from(encoded).toString("hex");
}

describe("api/_message", () => {
  const SVM_CHAIN_ID = CHAIN_IDs.SOLANA;
  const RECIPIENT_ADDRESS = "FmMK62wrtWVb5SVoTZftSCGw3nEDA79hDbZNTRnC1R6t";
  const HANDLER_ADDRESS = sdk.utils.getDeployedAddress(
    "MulticallHandler",
    CHAIN_IDs.SOLANA,
    true
  ) as string;
  const RELAYER_ADDRESS = sdk.constants.DEFAULT_SIMULATED_RELAYER_ADDRESS_SVM;
  const TOKEN_ADDRESS = TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.SOLANA];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("validateDepositMessage", () => {
    describe("Gas forwarding messages to SVM", () => {
      it("should accept a valid gas forwarding message to SVM", async () => {
        // Create a valid gas forwarding message:
        // - handler_message is empty (0x00000000)
        // - accounts has exactly 1 account (the recipient)
        // - value_amount > 0
        const valueAmount = 5000000n; // 0.005 SOL in lamports
        const handlerMessage = new Uint8Array(4).fill(0); // 0x00000000
        const accounts = [RECIPIENT_ADDRESS];

        const message = createEncodedMessage(
          HANDLER_ADDRESS,
          0,
          valueAmount,
          accounts,
          handlerMessage
        );

        // Mock isContractCache to return false (not a contract)
        mockIsContractCacheGet.mockResolvedValue(false);

        await expect(
          validateDepositMessage({
            recipient: RECIPIENT_ADDRESS,
            destinationChainId: SVM_CHAIN_ID,
            relayer: RELAYER_ADDRESS,
            outputTokenAddress: TOKEN_ADDRESS,
            amountInput: BigNumber.from(1000000),
            message,
          })
        ).resolves.not.toThrow();
      });

      it("should reject if handler_message is not empty", async () => {
        // Create a message with non-empty handler_message
        const valueAmount = 5000000n;
        const handlerMessage = new Uint8Array([0x01, 0x02, 0x03, 0x04]); // Not 0x00000000
        const accounts = [RECIPIENT_ADDRESS];

        const message = createEncodedMessage(
          HANDLER_ADDRESS,
          0,
          valueAmount,
          accounts,
          handlerMessage
        );

        mockIsContractCacheGet.mockResolvedValue(false);

        await expect(
          validateDepositMessage({
            recipient: RECIPIENT_ADDRESS,
            destinationChainId: SVM_CHAIN_ID,
            relayer: RELAYER_ADDRESS,
            outputTokenAddress: TOKEN_ADDRESS,
            amountInput: BigNumber.from(1000000),
            message,
          })
        ).rejects.toThrow(InvalidParamError);

        await expect(
          validateDepositMessage({
            recipient: RECIPIENT_ADDRESS,
            destinationChainId: SVM_CHAIN_ID,
            relayer: RELAYER_ADDRESS,
            outputTokenAddress: TOKEN_ADDRESS,
            amountInput: BigNumber.from(1000000),
            message,
          })
        ).rejects.toThrow(
          "Recipient must be a contract when a message is provided"
        );
      });

      it("should reject if accounts.length !== 1", async () => {
        // Create a message with 0 accounts
        const valueAmount = 5000000n;
        const handlerMessage = new Uint8Array(4).fill(0);
        const accounts: string[] = [];

        const messageNoAccounts = createEncodedMessage(
          HANDLER_ADDRESS,
          0,
          valueAmount,
          accounts,
          handlerMessage
        );

        mockIsContractCacheGet.mockResolvedValue(false);

        await expect(
          validateDepositMessage({
            recipient: RECIPIENT_ADDRESS,
            destinationChainId: SVM_CHAIN_ID,
            relayer: RELAYER_ADDRESS,
            outputTokenAddress: TOKEN_ADDRESS,
            amountInput: BigNumber.from(1000000),
            message: messageNoAccounts,
          })
        ).rejects.toThrow(
          "Recipient must be a contract when a message is provided"
        );

        // Create a message with 2 accounts
        const accountsTwo = [RECIPIENT_ADDRESS, HANDLER_ADDRESS];
        const messageTwoAccounts = createEncodedMessage(
          HANDLER_ADDRESS,
          0,
          valueAmount,
          accountsTwo,
          handlerMessage
        );

        await expect(
          validateDepositMessage({
            recipient: RECIPIENT_ADDRESS,
            destinationChainId: SVM_CHAIN_ID,
            relayer: RELAYER_ADDRESS,
            outputTokenAddress: TOKEN_ADDRESS,
            amountInput: BigNumber.from(1000000),
            message: messageTwoAccounts,
          })
        ).rejects.toThrow(
          "Recipient must be a contract when a message is provided"
        );
      });

      it("should reject if value_amount is 0", async () => {
        // Create a message with value_amount = 0
        const valueAmount = 0n;
        const handlerMessage = new Uint8Array(4).fill(0);
        const accounts = [RECIPIENT_ADDRESS];

        const message = createEncodedMessage(
          HANDLER_ADDRESS,
          0,
          valueAmount,
          accounts,
          handlerMessage
        );

        mockIsContractCacheGet.mockResolvedValue(false);

        await expect(
          validateDepositMessage({
            recipient: RECIPIENT_ADDRESS,
            destinationChainId: SVM_CHAIN_ID,
            relayer: RELAYER_ADDRESS,
            outputTokenAddress: TOKEN_ADDRESS,
            amountInput: BigNumber.from(1000000),
            message,
          })
        ).rejects.toThrow(
          "Recipient must be a contract when a message is provided"
        );
      });

      it("should accept message with larger value_amount", async () => {
        // Create a message with a larger value_amount
        const valueAmount = 1000000000n; // 1 SOL in lamports
        const handlerMessage = new Uint8Array(4).fill(0);
        const accounts = [RECIPIENT_ADDRESS];

        const message = createEncodedMessage(
          HANDLER_ADDRESS,
          0,
          valueAmount,
          accounts,
          handlerMessage
        );

        mockIsContractCacheGet.mockResolvedValue(false);

        await expect(
          validateDepositMessage({
            recipient: RECIPIENT_ADDRESS,
            destinationChainId: SVM_CHAIN_ID,
            relayer: RELAYER_ADDRESS,
            outputTokenAddress: TOKEN_ADDRESS,
            amountInput: BigNumber.from(1000000),
            message,
          })
        ).resolves.not.toThrow();
      });
    });

    describe("Message validation", () => {
      it("should reject non-hex string messages", async () => {
        const message = "not a hex string";

        await expect(
          validateDepositMessage({
            recipient: RECIPIENT_ADDRESS,
            destinationChainId: SVM_CHAIN_ID,
            relayer: RELAYER_ADDRESS,
            outputTokenAddress: TOKEN_ADDRESS,
            amountInput: BigNumber.from(1000000),
            message,
          })
        ).rejects.toThrow("Message must be a hex string");
      });

      it("should reject odd-length hex strings", async () => {
        const message = "0x123"; // Odd length

        await expect(
          validateDepositMessage({
            recipient: RECIPIENT_ADDRESS,
            destinationChainId: SVM_CHAIN_ID,
            relayer: RELAYER_ADDRESS,
            outputTokenAddress: TOKEN_ADDRESS,
            amountInput: BigNumber.from(1000000),
            message,
          })
        ).rejects.toThrow("Message must be an even hex string");
      });

      it("should accept empty messages", async () => {
        const message = "0x";

        await expect(
          validateDepositMessage({
            recipient: RECIPIENT_ADDRESS,
            destinationChainId: SVM_CHAIN_ID,
            relayer: RELAYER_ADDRESS,
            outputTokenAddress: TOKEN_ADDRESS,
            amountInput: BigNumber.from(1000000),
            message,
          })
        ).resolves.not.toThrow();
      });
    });
  });
});
