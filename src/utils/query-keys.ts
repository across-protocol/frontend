import { ChainId } from "./constants";


/**
 * Generates query keys for react-query `useQuery` hook, used in the `useBalance` hook.
 * @param chainId 
 * @param token
 * @param account 
 * @param blockNumber 
 * @returns An array of query keys for react-query `useQuery` hook.
 */
export function balanceQueryKey(chainId: ChainId, token: string, account: string, blockNumber?: number) {
	return ["balance", chainId, token, account, blockNumber];
}

/**
 * Generates query keys for react-query `useQuery` hook, used in the `useBalances` hook.
 * @param chainId 
 * @param tokens 
 * @param account 
 * @param blockNumber 
 * @returns An array of query keys for react-query `useQuery` hook.
 */
export function balancesQueryKey(chainId: ChainId, tokens: string[], account: string, blockNumber?: number) {
	return ["balances", chainId, tokens, account, blockNumber];
}
/**
 * @param chainId
 * @param tokenSymbol
 * @param blockNumber
 * @returns An array of query keys for react-query `useQuery` hook.
 */
export function bridgeFeesQueryKey(chainId: ChainId, tokenSymbol: string, blockNumber: number) {
	return ['bridgeFees', chainId, tokenSymbol, blockNumber];
}