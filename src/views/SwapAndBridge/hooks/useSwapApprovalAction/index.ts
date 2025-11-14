import { createSwapApprovalActionHook } from "./factory";
import { useConnectionSVM } from "hooks/useConnectionSVM";
import { useConnectionEVM } from "hooks/useConnectionEVM";
import { EVMSwapApprovalActionStrategy } from "./strategies/evm";
import { SVMSwapApprovalActionStrategy } from "./strategies/svm";
import { getEcosystem } from "utils";
import { SwapApprovalData } from "./strategies/types";
import { DepositActionParams } from "views/Bridge/hooks/useBridgeAction/strategies/types";

export function useSwapApprovalAction(
  originChainId: number,
  swapTxData?: SwapApprovalData,
  bridgeTxData?: DepositActionParams
) {
  const connectionEVM = useConnectionEVM();
  const connectionSVM = useConnectionSVM();

  const evmHook = createSwapApprovalActionHook(
    new EVMSwapApprovalActionStrategy(connectionEVM)
  );
  const svmHook = createSwapApprovalActionHook(
    new SVMSwapApprovalActionStrategy(connectionSVM, connectionEVM)
  );

  return getEcosystem(originChainId) === "evm"
    ? evmHook(swapTxData, bridgeTxData)
    : svmHook(swapTxData, bridgeTxData);
}

export type { SwapApprovalData } from "./strategies/types";
