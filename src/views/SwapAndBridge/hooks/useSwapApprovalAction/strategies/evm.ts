import { AbstractSwapApprovalActionStrategy } from "./abstract";
import { useConnectionEVM } from "hooks/useConnectionEVM";
import { ApprovalTxn, SwapApprovalData, SwapTx } from "./types";

export class EVMSwapApprovalActionStrategy extends AbstractSwapApprovalActionStrategy {
  constructor(evmConnection: ReturnType<typeof useConnectionEVM>) {
    super(evmConnection);
  }

  private get signer() {
    const { signer } = this.evmConnection;
    if (!signer) {
      throw new Error("No signer available");
    }
    return signer;
  }

  isConnected(): boolean {
    return this.evmConnection.isConnected;
  }

  isWrongNetwork(requiredChainId: number): boolean {
    const connectedChainId = this.evmConnection.chainId;
    return connectedChainId !== requiredChainId;
  }

  async switchNetwork(requiredChainId: number): Promise<void> {
    await this.evmConnection.setChain(requiredChainId);
  }

  async swap(approvalData: SwapApprovalData): Promise<string> {
    const signer = this.signer;
    // approvals first
    const approvals: ApprovalTxn[] = approvalData.approvalTxns || [];
    for (const approval of approvals) {
      await this.switchNetwork(approval.chainId);
      await signer.sendTransaction({
        to: approval.to,
        data: approval.data,
        chainId: approval.chainId,
      });
    }
    // then final swap
    const swapTx: SwapTx = approvalData.swapTx;
    await this.switchNetwork(swapTx.chainId);
    await this.assertCorrectNetwork(swapTx.chainId);
    const tx = await signer.sendTransaction({
      to: swapTx.to,
      data: swapTx.data,
      value: swapTx.value,
      chainId: swapTx.chainId,
      gasPrice: undefined,
      maxFeePerGas: swapTx.maxFeePerGas as any,
      maxPriorityFeePerGas: swapTx.maxPriorityFeePerGas as any,
      gasLimit: swapTx.gas as any,
    });
    return tx.hash;
  }
}
