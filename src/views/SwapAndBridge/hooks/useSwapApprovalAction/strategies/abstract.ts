import { useConnectionEVM } from "hooks/useConnectionEVM";
import { SwapApprovalActionStrategy } from "./types";

export abstract class AbstractSwapApprovalActionStrategy
  implements SwapApprovalActionStrategy
{
  constructor(readonly evmConnection: ReturnType<typeof useConnectionEVM>) {}

  abstract isConnected(): boolean;
  abstract isWrongNetwork(requiredChainId: number): boolean;
  abstract switchNetwork(requiredChainId: number): Promise<void>;
  abstract execute(approvalData: any): Promise<string>;

  async assertCorrectNetwork(requiredChainId: number) {
    const currentChainId = this.evmConnection.chainId;
    if (currentChainId !== requiredChainId) {
      await this.evmConnection.setChain(requiredChainId);
    }
  }
}
