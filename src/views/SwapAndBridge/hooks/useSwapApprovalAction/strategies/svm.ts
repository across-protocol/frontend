import { AbstractSwapApprovalActionStrategy } from "./abstract";
import { useConnectionSVM } from "hooks/useConnectionSVM";
import { useConnectionEVM } from "hooks/useConnectionEVM";
import { SwapApprovalData, SwapTx } from "./types";
import { Transaction, VersionedTransaction } from "@solana/web3.js";

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

  // stubbed  for now
  approve(_approvalData: SwapApprovalData): boolean {
    return true;
  }

  async swap(approvalData: SwapApprovalData): Promise<string> {
    if (!this.svmConnection.wallet?.adapter) {
      throw new Error("Wallet needs to be connected");
    }

    const swapTx: SwapTx = approvalData.swapTx;
    const txBuffer = Buffer.from(swapTx.data, "base64");
    const txUint8Array = new Uint8Array(txBuffer);

    const adapter = this.svmConnection.wallet.adapter;

    // Check if adapter has signTransaction method
    if (
      !adapter ||
      !("signTransaction" in adapter) ||
      typeof adapter.signTransaction !== "function"
    ) {
      throw new Error(
        "Wallet adapter does not support signTransaction. Please use a wallet that supports transaction signing."
      );
    }

    let signedTx: Transaction | VersionedTransaction;
    let signature: Buffer | Uint8Array | null;

    // Deserialize as VersionedTransaction
    const versionedTx = VersionedTransaction.deserialize(txUint8Array);

    // Sign the versioned transaction using the wallet adapter
    signedTx = await adapter.signTransaction(versionedTx);

    // Extract signature from the signed versioned transaction
    // VersionedTransaction signatures are Uint8Array
    signature = signedTx.signatures[0] || null;

    if (!signature) {
      throw new Error("Failed to get signature from signed transaction");
    }

    // Convert signature to base64 string for logging and return
    const signatureBase64 =
      signature instanceof Buffer
        ? signature.toString("base64")
        : Buffer.from(signature).toString("base64");

    console.log("Signed SVM tx:", signatureBase64);

    // Serialize the signed transaction and send it using the connection
    const serializedTx = signedTx.serialize();

    // Send the raw transaction using the connection's sendRawTransaction method
    await this.svmConnection.provider.sendRawTransaction(serializedTx, {
      skipPreflight: false,
      maxRetries: 3,
    });

    console.log("Tx sent and confirmed");

    return signatureBase64;
  }

  async execute(approvalData: SwapApprovalData): Promise<string> {
    this.approve(approvalData);
    return this.swap(approvalData);
  }
}
