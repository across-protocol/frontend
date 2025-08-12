import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createApproveCheckedInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from "@solana/web3.js";
import { address, getU64Encoder } from "@solana/kit";
import BN from "bn.js";

import { SvmSpokeClient } from "utils/codama";
import { ConvertDecimals } from "utils/convertdecimals";
import {
  bigToU8a32,
  fixedPointAdjustment,
  getConfig,
  toAddressType,
} from "utils";
import { useConnectionEVM } from "hooks/useConnectionEVM";
import { useConnectionSVM } from "hooks/useConnectionSVM";

import { AbstractBridgeActionStrategy } from "./abstract";
import { ApproveTokensParams, DepositActionParams } from "./types";
import { getDepositPda } from "@across-protocol/contracts/dist/src/svm/web3-v1";

const u64Encoder = getU64Encoder();
const config = getConfig();

export class SVMBridgeActionStrategy extends AbstractBridgeActionStrategy {
  private readonly seed = 0n;

  constructor(
    private readonly svmConnection: ReturnType<typeof useConnectionSVM>,
    evmConnection: ReturnType<typeof useConnectionEVM>
  ) {
    super(evmConnection);
  }

  get signerPublicKey() {
    if (!this.svmConnection.account) {
      throw new Error("'svmConnection.account' is not set");
    }
    return this.svmConnection.account;
  }

  isConnected() {
    return this.svmConnection.isConnected;
  }

  isWrongNetwork(_: number) {
    return !this.svmConnection.isConnected;
  }

  async switchNetwork(_: number) {
    return this.svmConnection.connect();
  }

  async approveTokens(_: ApproveTokensParams) {
    // NOOP for SVM because this instruction is part of the deposit transaction
    return;
  }

  async sendDepositTx(params: DepositActionParams) {
    const { depositArgs, selectedRoute, transferQuote } = params;

    if (!transferQuote?.quotedFees) {
      throw new Error("Missing exclusiveRelayer");
    }

    let _message = "";
    if (selectedRoute.externalProjectId === "hyperliquid") {
      // Note: Hyperliquid deposits are not supported from SVM chains
      // This is a fallback that should not be reached in practice
      throw new Error("Hyperliquid deposits are not supported from SVM chains");
    }

    const inputToken = config.getTokenInfoByAddressSafe(
      selectedRoute.fromChain,
      selectedRoute.fromTokenAddress
    );
    const outputToken = config.getTokenInfoByAddressSafe(
      selectedRoute.toChain,
      selectedRoute.toTokenAddress
    );
    if (!inputToken || !outputToken) {
      throw new Error("Invalid input or output token");
    }

    const _inputAmount = depositArgs.amount;
    const _outputAmount = _inputAmount.sub(
      _inputAmount
        .mul(transferQuote.quotedFees.totalRelayFee.pct)
        .div(fixedPointAdjustment)
    );
    const inputAmount = BigInt(_inputAmount.toString());
    const outputAmount = BigInt(
      ConvertDecimals(
        inputToken.decimals,
        outputToken.decimals
      )(_outputAmount.toString()).toString()
    );

    const _recipient = toAddressType(
      depositArgs.toAddress,
      selectedRoute.toChain
    );
    const recipient = new PublicKey(_recipient.toBase58());
    const _inputToken = toAddressType(
      selectedRoute.fromTokenAddress,
      selectedRoute.fromChain
    );
    const inputTokenAddress = new PublicKey(_inputToken.toBase58());
    const _outputToken = toAddressType(
      selectedRoute.toTokenAddress,
      selectedRoute.toChain
    );
    const outputTokenAddress = new PublicKey(_outputToken.toBase58());
    const _exclusiveRelayer = toAddressType(
      transferQuote.quotedFees.exclusiveRelayer,
      selectedRoute.toChain
    );
    const exclusiveRelayer = new PublicKey(_exclusiveRelayer.toBase58());

    const originChainId = selectedRoute.fromChain;
    const destinationChainId = BigInt(selectedRoute.toChain);
    const quoteTimestamp = transferQuote.quotedFees.quoteTimestamp;
    const fillDeadline = transferQuote.quotedFees.fillDeadline;
    const exclusivityDeadline = transferQuote.quotedFees.exclusivityDeadline;
    const message = Buffer.from(_message);
    const integratorId = depositArgs.integratorId;

    const statePda = this._getStatePDA(originChainId);

    const eventAuthorityPda = this._getEventAuthorityPDA(originChainId);

    // Get the user's token account
    const depositorTokenAccount = getAssociatedTokenAddressSync(
      inputTokenAddress,
      this.signerPublicKey,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // vaults should be initialized manually when adding new tokens
    const vault = getAssociatedTokenAddressSync(
      inputTokenAddress,
      statePda,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Get the delegatePda that will be used for both approve and deposit
    const delegatePda = getDepositPda(
      {
        depositor: this.signerPublicKey,
        recipient,
        inputToken: inputTokenAddress,
        outputToken: outputTokenAddress,
        inputAmount: new BN(inputAmount.toString()),
        outputAmount: Array.from(bigToU8a32(outputAmount)),
        destinationChainId: new BN(destinationChainId.toString()),
        exclusiveRelayer,
        quoteTimestamp: new BN(quoteTimestamp.toString()),
        fillDeadline: new BN(fillDeadline),
        exclusivityParameter: new BN(exclusivityDeadline),
        message: new Uint8Array(message),
      },
      config.getSpokePoolProgramId(originChainId)
    );

    const approveTokenInstruction = this._createApproveInstruction(
      depositorTokenAccount,
      inputTokenAddress,
      delegatePda,
      inputAmount,
      inputToken.decimals
    );

    const depositInstruction = this._createDepositInstruction(
      originChainId,
      this.signerPublicKey,
      statePda,
      delegatePda,
      depositorTokenAccount,
      vault,
      inputTokenAddress,
      outputTokenAddress,
      recipient,
      inputAmount,
      outputAmount,
      destinationChainId,
      exclusiveRelayer,
      Number(quoteTimestamp),
      Number(fillDeadline),
      Number(exclusivityDeadline),
      message,
      eventAuthorityPda
    );

    const tx = new Transaction().add(
      approveTokenInstruction,
      depositInstruction
    );

    if (integratorId !== "") {
      const MemoIx = new TransactionInstruction({
        keys: [
          { pubkey: this.signerPublicKey, isSigner: true, isWritable: true },
        ],
        data: Buffer.from(integratorId, "utf-8"),
        programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"), // Memo program ID
      });
      tx.add(MemoIx);
    }

    return this._sendTransaction(tx);
  }

  private _getStatePDA(fromChain: number) {
    const programId = config.getSpokePoolProgramId(fromChain);
    const [statePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("state"), Buffer.from(u64Encoder.encode(this.seed))],
      programId
    );
    return statePda;
  }

  private _getEventAuthorityPDA(originChainId: number) {
    const programId = config.getSpokePoolProgramId(originChainId);
    const [eventAuthorityPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("__event_authority")],
      programId
    );
    return eventAuthorityPda;
  }

  private _createDepositInstruction(
    originChainId: number,
    depositor: PublicKey,
    statePda: PublicKey,
    delegatePda: PublicKey,
    depositorTokenAccount: PublicKey,
    vault: PublicKey,
    inputTokenAddress: PublicKey,
    outputTokenAddress: PublicKey,
    recipient: PublicKey,
    inputAmount: bigint,
    outputAmount: bigint,
    destinationChainId: bigint,
    exclusiveRelayer: PublicKey,
    quoteTimestamp: number,
    fillDeadline: number,
    exclusivityDeadline: number,
    message: Buffer,
    eventAuthorityPda: PublicKey
  ): TransactionInstruction {
    const depositInstructionDataEncoder =
      SvmSpokeClient.getDepositInstructionDataEncoder();

    const depositInstructionData = depositInstructionDataEncoder.encode({
      depositor: address(depositor.toString()),
      recipient: address(recipient.toString()),
      inputToken: address(inputTokenAddress.toString()),
      outputToken: address(outputTokenAddress.toString()),
      inputAmount,
      outputAmount: bigToU8a32(outputAmount),
      destinationChainId,
      exclusiveRelayer: address(exclusiveRelayer.toString()),
      quoteTimestamp,
      fillDeadline,
      exclusivityParameter: exclusivityDeadline,
      message: new Uint8Array(message),
    });

    return new TransactionInstruction({
      programId: config.getSpokePoolProgramId(originChainId),
      data: Buffer.from(depositInstructionData),
      keys: [
        { pubkey: depositor, isSigner: true, isWritable: true },
        { pubkey: statePda, isSigner: false, isWritable: true },
        { pubkey: delegatePda, isSigner: false, isWritable: false },
        { pubkey: depositorTokenAccount, isSigner: false, isWritable: true },
        { pubkey: vault, isSigner: false, isWritable: true },
        { pubkey: inputTokenAddress, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        {
          pubkey: ASSOCIATED_TOKEN_PROGRAM_ID,
          isSigner: false,
          isWritable: false,
        },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        // manually append these 2 state accounts, not explicitly listed in program
        { pubkey: eventAuthorityPda, isSigner: false, isWritable: false },
        {
          pubkey: config.getSpokePoolProgramId(originChainId),
          isSigner: false,
          isWritable: false,
        },
      ],
    });
  }

  private _createApproveInstruction(
    depositorTokenAccount: PublicKey,
    inputTokenAddress: PublicKey,
    delegatePda: PublicKey,
    inputAmount: bigint,
    inputTokenDecimals: number
  ): TransactionInstruction {
    return createApproveCheckedInstruction(
      depositorTokenAccount,
      inputTokenAddress,
      delegatePda,
      this.signerPublicKey,
      inputAmount,
      inputTokenDecimals,
      undefined,
      TOKEN_PROGRAM_ID
    );
  }

  private async _sendTransaction(tx: Transaction) {
    if (!this.svmConnection.wallet?.adapter) {
      throw new Error("Wallet needs to be connected");
    }

    return this.svmConnection.wallet.adapter.sendTransaction(
      tx,
      this.svmConnection.provider
    );
  }
}
