import { useQuery } from 'react-query';
import { ethers } from 'ethers';
import { bridgeFeesQueryKey, getBridgeFees, PROVIDERS } from 'utils';
import { useConnection } from 'state/hooks';
import { useBlockNumber } from './useBlockNumber';



/**
 * This hook calculates the bridge fees for a given token and amount.
 * @remarks This hook **SHOULD NOT** be used to calculate the fees for a L1 to L2 transfer, as those use canonical bridges instead.
 * @param amount - The amount to check bridge fees for.
 * @param tokenSymbol - The token symbol to check bridge fees for. 
 * @returns The bridge fees for the given amount and token symbol and the UseQueryResult object. 
 */
export function useBridgeFees(amount: ethers.BigNumber, tokenSymbol: string) {
	const { chainId } = useConnection();
	const { blockNumber } = useBlockNumber(chainId);
	const { data: fees, ...delegated } = useQuery(bridgeFeesQueryKey(chainId!, tokenSymbol, blockNumber!), async () => {
		const provider = await PROVIDERS[chainId!]();
		const blockTimestamp = await provider.getBlock(blockNumber!).then(block => block.timestamp);
		return getBridgeFees({ amount, tokenSymbol, blockTimestamp });
	}, {
		enabled: !!blockNumber && !!chainId,
	});
	return {
		fees,
		...delegated
	}
}


