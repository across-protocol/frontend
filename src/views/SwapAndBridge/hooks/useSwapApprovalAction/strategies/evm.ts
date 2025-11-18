import { AbstractSwapApprovalActionStrategy } from "./abstract";
import { useConnectionEVM } from "hooks/useConnectionEVM";
import { SwapApprovalQuote } from "utils/serverless-api/prod/swap-approval";

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

  async approve(
    approvalTxns: SwapApprovalQuote["approvalTxns"]
  ): Promise<boolean> {
    const signer = this.getSigner();
    // approvals first
    const approvals = approvalTxns || [];
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

  async swap(swapTx: SwapApprovalQuote["swapTx"]): Promise<string> {
    const signer = this.getSigner();

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

  async execute(swapQuote: SwapApprovalQuote): Promise<string> {
    try {
      await this.approve(swapQuote.approvalTxns);
      return await this.swap(swapQuote.swapTx);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}
