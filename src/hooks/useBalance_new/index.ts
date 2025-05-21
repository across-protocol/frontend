import { useConnectionEVM } from "../useConnectionEVM";
import { useConnectionSVM } from "../useConnectionSVM";
import {
  createBalanceHook,
  createBalancesBySymbolsHook,
  createBalanceBySymbolPerChainHook,
} from "./factory";
import { EVMBalanceStrategy } from "./strategies/evm";
import { SVMBalanceStrategy } from "./strategies/svm";

export { zeroBalance } from "./utils";

function useBalanceStrategies() {
  const connectionEVM = useConnectionEVM();
  const connectionSVM = useConnectionSVM();
  return {
    evm: new EVMBalanceStrategy(connectionEVM),
    svm: new SVMBalanceStrategy(connectionSVM),
  };
}
export function useBalance(
  tokenSymbol?: string,
  chainId?: number,
  account?: string
) {
  const strategies = useBalanceStrategies();
  return createBalanceHook(strategies)(tokenSymbol, chainId, account);
}

export function useBalancesBySymbols({
  tokenSymbols,
  chainId,
  account,
}: {
  tokenSymbols: string[];
  chainId?: number;
  account?: string;
}) {
  const strategies = useBalanceStrategies();
  return createBalancesBySymbolsHook(strategies)({
    tokenSymbols,
    chainId,
    account,
  });
}

export function useBalanceBySymbolPerChain({
  tokenSymbol,
  chainIds,
  account,
}: {
  tokenSymbol?: string;
  chainIds: number[];
  account?: string;
}) {
  const strategies = useBalanceStrategies();
  return createBalanceBySymbolPerChainHook(strategies)({
    tokenSymbol,
    chainIds,
    account,
  });
}
