import { useQuery } from 'react-query';
import { useConnection } from 'state/hooks';
import { useBlock } from './useBlock';
import { getBalance, getBalances, balanceQueryKey, balancesQueryKey } from 'utils';

/**
 * @param token - The token to fetch the balance of.
 * @param account - The account to query the balance of
 * @param blockNumber - The preferred block number to execute the query. Note, past blocks require an archive node.
 * @remarks Passing the zero address as token will return the ETH balance. Passing no account will return the balance of the connected account.
 * @returns The balance of the account and the UseQueryResult object
 */
export function useBalance(token: string, account?: string, blockNumber?: number) {
	const { chainId, account: connectedAccount } = useConnection();
	const accountToQuery = account ?? connectedAccount;
	const { block: latestBlock } = useBlock(chainId);
	const blockNumberToQuery = blockNumber ?? latestBlock?.number;
	const { data: balance, ...delegated } = useQuery(balanceQueryKey(chainId!, token, accountToQuery!, blockNumberToQuery), async () => {
		const balance = await getBalance(chainId!, token, accountToQuery!, blockNumberToQuery);
		return balance;
	}, {
		enabled: !!chainId && !!accountToQuery,
		// We already re-fetch when the block change, so we don't need to re-fetch on an interval.
		refetchInterval: false
	});
	return {
		balance,
		...delegated
	}
}

/**
 * 
 * @param tokens - The tokens to fetch the balance of.
 * @param account - The account to query the balance of 
 * @param blockNumber - The preferred block number to execute the query. Note, past blocks require an archive node. 
 */
export function useBalances(tokens: string[], account?: string, blockNumber?: number) {
	const { chainId, account: connectedAccount } = useConnection();
	const accountToQuery = account ?? connectedAccount;
	const { block: latestBlock } = useBlock(chainId);
	const blockNumberToQuery = blockNumber ?? latestBlock?.number;
	// To fetch balances, we need a list of tokens, an account to get balances of, and a specified chainId.
	const enabledQuery = !!chainId && !!accountToQuery && tokens.length > 0
	const { data: balances, ...delegated } = useQuery(balancesQueryKey(chainId!, tokens, accountToQuery!, blockNumberToQuery), async () => {
		const balances = await getBalances(chainId!, tokens, accountToQuery!, blockNumberToQuery);
		return balances;
	}, {
		enabled: enabledQuery,
		// We already re-fetch when the block change, so we don't need to re-fetch on an interval.
		refetchInterval: false
	});
	return {
		balances,
		...delegated
	}
}