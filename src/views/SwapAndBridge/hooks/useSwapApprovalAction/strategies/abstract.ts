import { useConnectionEVM } from "hooks/useConnectionEVM";
import { SwapApprovalActionStrategy, SwapApprovalData } from "./types";
import { DepositActionParams } from "views/Bridge/hooks/useBridgeAction/strategies/types";

export abstract class AbstractSwapApprovalActionStrategy
  implements SwapApprovalActionStrategy
{
  constructor(readonly evmConnection: ReturnType<typeof useConnectionEVM>) {}

  abstract isConnected(): boolean;
  abstract isWrongNetwork(requiredChainId: number): boolean;
  abstract switchNetwork(requiredChainId: number): Promise<void>;
  abstract execute(
    approvalData?: SwapApprovalData,
    bridgeTxData?: DepositActionParams
  ): Promise<string>;

  async assertCorrectNetwork(requiredChainId: number) {
    const currentChainId = this.evmConnection.chainId;
    if (currentChainId !== requiredChainId) {
      await this.evmConnection.setChain(requiredChainId);
    }
  }
}
