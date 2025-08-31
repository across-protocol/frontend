import { useConnectionEVM } from "hooks/useConnectionEVM";
import {
  ApproveTokensParams,
  BridgeActionStrategy,
  DepositActionParams,
} from "./types";

export abstract class AbstractBridgeActionStrategy
  implements BridgeActionStrategy
{
  constructor(readonly evmConnection: ReturnType<typeof useConnectionEVM>) {}

  abstract isConnected(): boolean;
  abstract isWrongNetwork(requiredChainId: number): boolean;
  abstract switchNetwork(requiredChainId: number): Promise<void>;
  abstract approveTokens(params: ApproveTokensParams): Promise<void>;
  abstract sendDepositTx(params: DepositActionParams): Promise<string>;

  async assertCorrectNetwork(requiredChainId: number) {
    const currentChainId = this.evmConnection.chainId;
    if (currentChainId !== requiredChainId) {
      await this.evmConnection.setChain(requiredChainId);
    }
  }
}
