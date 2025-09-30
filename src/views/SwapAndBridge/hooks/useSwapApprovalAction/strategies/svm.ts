import { AbstractSwapApprovalActionStrategy } from "./abstract";
import { useConnectionSVM } from "hooks/useConnectionSVM";
import { useConnectionEVM } from "hooks/useConnectionEVM";
import { SwapApprovalData, SwapTx } from "./types";

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
  approve(approvalData: SwapApprovalData): boolean {
    return true;
  }

  async swap(approvalData: SwapApprovalData): Promise<string> {
    if (!this.svmConnection.wallet?.adapter) {
      throw new Error("Wallet needs to be connected");
    }

    const swapTx: SwapTx = approvalData.swapTx;
    const sig = await this.svmConnection.provider.sendRawTransaction(
      Buffer.from(swapTx.data, "base64")
    );
    return sig;
  }

  async execute(approvalData: SwapApprovalData): Promise<string> {
    this.approve(approvalData);
    return this.swap(approvalData);
  }
}
