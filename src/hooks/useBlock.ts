import { ethers } from 'ethers';
import { useQuery } from 'react-query';
import { PROVIDERS, ChainId, CHAINS } from 'utils';

/**
 * 
 * @param chainId The chain Id of the chain to poll for new blocks.
 * @returns The latest block, and the useQueryResult object.
 */
export function useBlock(chainId?: ChainId) {
	const { data: block, ...delegated } = useQuery(["block", chainId], async () => {
		return await getBlock(chainId!);
	}, {
		// refetch based on the chain polling interval
		refetchInterval: CHAINS[chainId ?? 1]?.pollingInterval ?? 5 * 1000,
		enabled: !!chainId,
	});
	return {
		block,
		...delegated
	}
}

/**
 * @param chainId The chain Id of the chain to fetch the latest block from.
 * @param blockHashOrBlockTag The block hash or block tag to fetch, defaults to "latest".
 * @returns A promise resolving to the requested block.
 */
async function getBlock(chainId: ChainId, blockHashOrBlockTag?: ethers.providers.BlockTag): Promise<ethers.providers.Block> {
	const provider = PROVIDERS[chainId]();
	const hashOrTag = blockHashOrBlockTag ?? 'latest';
	return provider.getBlock(hashOrTag);
}