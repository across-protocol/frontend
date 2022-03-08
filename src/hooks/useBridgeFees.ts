import { useQuery } from 'react-query';
import { ethers } from 'ethers';
import { bridgeFeesQueryKey, getBridgeFees } from 'utils';
import { useConnection } from 'state/hooks';
import { useBlock } from './useBlock';



/**
 * This hook calculates the bridge fees for a given token and amount.
 * @remarks This hook **SHOULD NOT** be used to calculate the fees for a L1 to L2 transfer, as those use canonical bridges instead.
 * @param amount - The amount to check bridge fees for.
 * @param tokenSymbol - The token symbol to check bridge fees for. 
 * @returns The bridge fees for the given amount and token symbol and the UseQueryResult object. 
 */
export function useBridgeFees(amount: ethers.BigNumber, tokenSymbol: string) {
	const { chainId } = useConnection();
	const { block } = useBlock(chainId);
	const enabledQuery = !!chainId && !!block;
	const queryKey = enabledQuery ? bridgeFeesQueryKey(tokenSymbol, amount, chainId, block.number) : "DISABLED_BRIDGE_FEE_QUERY";
	const { data: fees, ...delegated } = useQuery(queryKey, async () => {
		return getBridgeFees({ amount, tokenSymbol, blockTimestamp: block!.timestamp });
	}, {
		enabled: enabledQuery,
	});
	return {
		fees,
		...delegated
	}
}


