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
} from "@solana/web3.js";
import { address, getU64Encoder } from "@solana/kit";

import { SvmSpokeClient } from "utils/codama";
import { fixedPointAdjustment, getConfig, toAddressType } from "utils";
import { AbstractBridgeActionStrategy } from "./abstract";
import { useConnectionEVM } from "hooks/useConnectionEVM";
import { useConnectionSVM } from "hooks/useConnectionSVM";

import { ApproveTokensParams, DepositActionParams } from "./types";

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

    let _message = "0x";
    if (selectedRoute.externalProjectId === "hyperliquid") {
      _message = await this.signHyperliquidMessage(params);
    }

    const _inputAmount = depositArgs.amount;
    const _outputAmount = _inputAmount.sub(
      _inputAmount
        .mul(transferQuote.quotedFees.totalRelayFee.pct)
        .div(fixedPointAdjustment)
    );
    const inputAmount = BigInt(_inputAmount.toString());
    const outputAmount = BigInt(_outputAmount.toString());

    const _recipient = toAddressType(depositArgs.toAddress);
    const recipient = new PublicKey(_recipient.toBase58());
    const _inputToken = toAddressType(selectedRoute.fromTokenAddress);
    const inputToken = new PublicKey(_inputToken.toBase58());
    const _outputToken = toAddressType(selectedRoute.toTokenAddress);
    const outputToken = new PublicKey(_outputToken.toBase58());
    const _exclusiveRelayer = toAddressType(
      transferQuote.quotedFees.exclusiveRelayer
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
    const routePda = this._getRoutePDA(
      originChainId,
      inputToken,
      destinationChainId
    );
    const eventAuthorityPda = this._getEventAuthorityPDA(originChainId);
    const depositorTokenAccount = getAssociatedTokenAddressSync(
      inputToken,
      this.signerPublicKey,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    // Find ATA for the input token to be stored by state (vault). This was created when the route was enabled.
    const vault = getAssociatedTokenAddressSync(
      inputToken,
      statePda,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const approveTokenInstruction = await this._getApproveInstruction(params);

    const depositInstructionDataEncoder =
      SvmSpokeClient.getDepositInstructionDataEncoder();
    const depositInstructionData = depositInstructionDataEncoder.encode({
      depositor: address(this.signerPublicKey.toString()),
      recipient: address(recipient.toString()),
      inputToken: address(inputToken.toString()),
      outputToken: address(outputToken.toString()),
      inputAmount: inputAmount,
      outputAmount: outputAmount,
      destinationChainId,
      exclusiveRelayer: address(exclusiveRelayer.toString()),
      quoteTimestamp: Number(quoteTimestamp),
      fillDeadline: Number(fillDeadline),
      exclusivityParameter: Number(exclusivityDeadline),
      message: new Uint8Array(message),
    });
    const depositInstruction = new TransactionInstruction({
      programId: config.getSpokePoolProgramId(originChainId),
      data: Buffer.from(depositInstructionData),
      keys: [
        { pubkey: this.signerPublicKey, isSigner: true, isWritable: true },
        { pubkey: statePda, isSigner: false, isWritable: true },
        { pubkey: routePda, isSigner: false, isWritable: false },
        { pubkey: depositorTokenAccount, isSigner: false, isWritable: false },
        { pubkey: vault, isSigner: false, isWritable: true },
        { pubkey: inputToken, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: eventAuthorityPda, isSigner: false, isWritable: false },
        {
          pubkey: config.getSpokePoolProgramId(originChainId),
          isSigner: false,
          isWritable: false,
        },
      ],
    });

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

  private async _getApproveInstruction(params: ApproveTokensParams) {
    const { depositArgs, selectedRoute } = params;
    const { fromChain, amount } = depositArgs;

    const signer = this.signerPublicKey;
    const inputToken = new PublicKey(selectedRoute.fromTokenAddress);

    const statePda = this._getStatePDA(fromChain);
    const userTokenAccount = getAssociatedTokenAddressSync(inputToken, signer);

    const tokenInfo = config.getTokenInfoBySymbol(
      fromChain,
      selectedRoute.fromTokenSymbol
    );
    const tokenDecimals = tokenInfo.decimals;

    const approveInstruction = createApproveCheckedInstruction(
      userTokenAccount,
      inputToken,
      statePda,
      signer,
      BigInt(amount.toString()),
      tokenDecimals,
      undefined,
      TOKEN_PROGRAM_ID
    );

    return approveInstruction;
  }

  private _getStatePDA(fromChain: number) {
    const programId = config.getSpokePoolProgramId(fromChain);
    const [statePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("state"), Buffer.from(u64Encoder.encode(this.seed))],
      programId
    );
    return statePda;
  }

  private _getRoutePDA(
    originChainId: number,
    inputToken: PublicKey,
    destinationChainId: bigint
  ) {
    const programId = config.getSpokePoolProgramId(originChainId);
    const [routePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("route"),
        inputToken.toBytes(),
        Buffer.from(u64Encoder.encode(this.seed)),
        Buffer.from(u64Encoder.encode(destinationChainId)),
      ],
      programId
    );
    return routePda;
  }

  private _getEventAuthorityPDA(originChainId: number) {
    const programId = config.getSpokePoolProgramId(originChainId);
    const [eventAuthorityPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("__event_authority")],
      programId
    );
    return eventAuthorityPda;
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
