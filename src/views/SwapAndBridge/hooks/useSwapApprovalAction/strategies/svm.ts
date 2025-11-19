import { VersionedTransaction } from "@solana/web3.js";
import { AbstractSwapApprovalActionStrategy } from "./abstract";
import { useConnectionSVM } from "hooks/useConnectionSVM";
import { useConnectionEVM } from "hooks/useConnectionEVM";
import { SwapApprovalData, SwapTx } from "./types";
import { DepositActionParams } from "views/Bridge/hooks/useBridgeAction/strategies/types";

export class SVMSwapApprovalActionStrategy extends AbstractSwapApprovalActionStrategy {
  constructor(
    private readonly svmConnection: ReturnType<typeof useConnectionSVM>,
    evmConnection: ReturnType<typeof useConnectionEVM>
  ) {
    super(evmConnection);
  }

  isConnected(): boolean {
    return this.svmConnection.isConnected;
  }

  isWrongNetwork(_: number): boolean {
    return !this.svmConnection.isConnected;
  }

  async switchNetwork(_: number): Promise<void> {
    await this.svmConnection.connect();
  }

  async swap(approvalData: SwapApprovalData): Promise<string> {
    if (!this.svmConnection.wallet?.adapter) {
      throw new Error("Wallet needs to be connected");
    }

    const swapTx: SwapTx = approvalData.swapTx;
    const txBuffer = Buffer.from(swapTx.data, "base64");
    // Convert to VersionedTransaction for the wallet adapter
    // The wallet adapter expects a VersionedTransaction from @solana/web3.js
    const transaction = VersionedTransaction.deserialize(
      new Uint8Array(txBuffer)
    );
    const signature = await this.svmConnection.wallet.adapter.sendTransaction(
      transaction,
      this.svmConnection.provider
    );

    return signature;
  }

  async execute(
    swapTxData?: SwapApprovalData,
    bridgeTxData?: DepositActionParams
  ): Promise<string> {
    try {
      if (!swapTxData) {
        throw new Error("No swap Tx data found");
      }
      // SVM strategy doesn't support bridge transactions for now
      if (bridgeTxData) {
        throw new Error("Bridge transactions are not supported for SVM");
      }
      return await this.swap(swapTxData);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}
