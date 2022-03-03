import { useQuery } from 'react-query';
import { PROVIDERS, ChainId } from 'utils';


/**
 * 
 * @param chainId The chain Id of the chain to poll for new blocks.
 * @returns The balance of the account and the UseQueryResult object
 */
export function useBlockNumber(chainId?: ChainId) {
	const { data: blockNumber, ...delegated } = useQuery(["block", chainId], async () => {
		return await getBlockNumber(chainId!);
	}, {
		// refetch every 5 seconds
		refetchInterval: 5 * 1000,
		enabled: !!chainId,
	});
	return {
		blockNumber,
		...delegated
	}
}

/**
 * 
 * @param chainId The chain Id of the chain to fetch the latest block from.
 * @returns A promise resolving to the latest block number.
 */
async function getBlockNumber(chainId: ChainId): Promise<number> {
	const provider = PROVIDERS[chainId]();
	return provider.getBlockNumber();
}