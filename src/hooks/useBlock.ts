import { ethers } from "ethers";
import { useQuery } from "react-query";
import { getProvider, ChainId, getChainInfo, latestBlockQueryKey } from "utils";

/**
 * Fetches the latest block from a given chain Id on an interval.
 * @param chainId The chain Id of the chain to poll for new blocks.
 * @returns The latest block, and the useQueryResult object.
 */
export function useBlock(chainId?: ChainId) {
  const enabledQuery = !!chainId;
  const queryKey = enabledQuery
    ? latestBlockQueryKey(chainId)
    : "DISABLED_BLOCK_QUERY";
  const refetchInterval = enabledQuery
    ? getChainInfo(chainId).pollingInterval
    : undefined;
  const { data: block, ...delegated } = useQuery(
    queryKey,
    async () => {
      return getBlock(chainId!);
    },
    {
      // refetch based on the chain polling interval
      refetchInterval,
      enabled: enabledQuery,
    }
  );
  return {
    block,
    ...delegated,
  };
}

/**
 * @param chainId The chain Id of the chain to fetch the latest block from.
 * @param blockHashOrBlockTag The block hash or block tag to fetch, defaults to "latest".
 * @returns A promise resolving to the requested block.
 */
async function getBlock(
  chainId: ChainId,
  blockHashOrBlockTag: ethers.providers.BlockTag = "latest"
): Promise<ethers.providers.Block> {
  const provider = getProvider(chainId);
  return provider.getBlock(blockHashOrBlockTag);
}
