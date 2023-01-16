import { useMemo } from "react";
import { useQuery } from "react-query";
import { ChainId, getChainInfo, getProvider, Provider } from "utils";

export function useTransaction(chainId: ChainId, txHash?: string) {
  const provider = useMemo(
    () => (chainId ? getProvider(chainId) : undefined),
    [chainId]
  );

  const explorerUrl = txHash
    ? getChainInfo(chainId).constructExplorerLink(txHash)
    : undefined;

  const query = useQuery(
    ["transaction-tracking", txHash],
    () => getTransactionReceipt(txHash!, provider!),
    {
      enabled: !!txHash && !!provider,
      staleTime: Infinity,
    }
  );

  return {
    receipt: query.data?.receipt,
    explorerUrl,
    ...query,
  };
}

async function getTransactionReceipt(tx: string, provider: Provider) {
  const receipt = await provider.getTransactionReceipt(tx);
  return { receipt };
}
