import { useQuery } from 'react-query';
import { PROVIDERS, ChainId } from 'utils';


/**
 * 
 * @param chainId The chain Id of the chain to poll for new blocks.
 * @returns The balance of the account and the UseQueryResult object
 */
export function useBlockNumber(chainId: ChainId) {
	const { data: blockNumber, ...delegated } = useQuery(["block", chainId], async () => {
		const provider = PROVIDERS[chainId]();
		const blockNumber = await provider.getBlockNumber();
		return blockNumber;
	}, {
		// refetch every 5 seconds
		refetchInterval: 5 * 1000,
	});
	return {
		blockNumber,
		...delegated
	}
}