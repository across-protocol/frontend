import { AbstractSwapApprovalActionStrategy } from "./abstract";
import { useConnectionEVM } from "hooks/useConnectionEVM";
import { ApprovalTxn, SwapApprovalData, SwapTx } from "./types";

export class EVMSwapApprovalActionStrategy extends AbstractSwapApprovalActionStrategy {
  constructor(evmConnection: ReturnType<typeof useConnectionEVM>) {
    super(evmConnection);
  }

  private getSigner() {
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

  async approve(approvalData: SwapApprovalData): Promise<boolean> {
    const signer = this.getSigner();
    // approvals first
    const approvals: ApprovalTxn[] = approvalData.approvalTxns || [];
    for (const approval of approvals) {
      await this.switchNetwork(approval.chainId);
      await this.assertCorrectNetwork(approval.chainId);
      await signer.sendTransaction({
        to: approval.to,
        data: approval.data,
        chainId: approval.chainId,
      });
    }
    return true;
  }

  async swap(approvalData: SwapApprovalData): Promise<string> {
    const signer = this.getSigner();

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

  async execute(approvalData: SwapApprovalData): Promise<string> {
    try {
      await this.approve(approvalData);
      return await this.swap(approvalData);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}
