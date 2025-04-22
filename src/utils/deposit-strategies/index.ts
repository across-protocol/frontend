import { chainIsSvm } from "utils/sdk";
import { EVMStrategy } from "../../views/DepositStatus/hooks/useDepositTracking_new/strategies/evm";
import { SVMStrategy } from "../../views/DepositStatus/hooks/useDepositTracking_new/strategies/svm";

/**
 * Factory function to create the appropriate chain strategy based on the chain type
 * @param chainId Chain ID to create strategy for
 * @returns Appropriate chain strategy instance
 */
export function createChainStrategies(fromChainId: number, toChainId: number) {
  return {
    depositStrategy: chainIsSvm(fromChainId)
      ? new SVMStrategy(fromChainId)
      : new EVMStrategy(fromChainId),
    fillStrategy: chainIsSvm(toChainId)
      ? new SVMStrategy(toChainId)
      : new EVMStrategy(toChainId),
  };
}
