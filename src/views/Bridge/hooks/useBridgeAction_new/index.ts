import { SelectedRoute } from "../../utils";
import { TransferQuote } from "../useTransferQuote";
import { createBridgeActionHook } from "./factory";
import { useConnectionSVM } from "hooks/useConnectionSVM";
import { useConnectionEVM } from "hooks/useConnectionEVM";
import { EVMBridgeActionStrategy } from "./strategies/evm";
import { SVMBridgeActionStrategy } from "./strategies/svm";

function useBridgeActionEVM() {
  const connectionEVM = useConnectionEVM();
  const strategy = new EVMBridgeActionStrategy(connectionEVM);
  return createBridgeActionHook(strategy);
}

function useBridgeActionSVM() {
  const connectionSVM = useConnectionSVM();
  const connectionEVM = useConnectionEVM();
  const strategy = new SVMBridgeActionStrategy(connectionSVM, connectionEVM);
  return createBridgeActionHook(strategy);
}

export function useBridgeAction(
  bridgeActionType: "svm" | "evm",
  isQuoteUpdating: boolean,
  selectedRoute: SelectedRoute,
  usedTransferQuote: TransferQuote
) {
  const evmHook = useBridgeActionEVM();
  const svmHook = useBridgeActionSVM();

  return bridgeActionType === "evm"
    ? evmHook(isQuoteUpdating, selectedRoute, usedTransferQuote)
    : svmHook(isQuoteUpdating, selectedRoute, usedTransferQuote);
}
