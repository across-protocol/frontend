import { ethers } from "ethers";
import { ChainId } from "./constants";

/**
 * Generates query keys for react-query `useQuery` hook, used in the `useLatestBlock` hook. 
 * @param chainId The chain Id of the chain to poll for new blocks.
 * @returns An array of query keys for react-query `useQuery` hook. 
 */
export function latestBlockQueryKey(chainId: ChainId) {
	return ["block", chainId];
}


/**
 * Generates query keys for react-query `useQuery` hook, used in the `useBalance` hook.
 * @param chainId  The chain Id of the chain to execute the query on.
 * @param token  The token to fetch the balance of.
 * @param account  The account to query the balance of.
 * @param blockNumber  The block number to execute the query on.
 * @returns An array of query keys for react-query `useQuery` hook.
 */
export function balanceQueryKey(chainId: ChainId, token: string, account: string, blockNumber: number) {
	return ["balance", chainId, token, account, blockNumber];
}

/**
 * Generates query keys for react-query `useQuery` hook, used in the `useBalances` hook.
 * @param chainId  The chain Id of the chain to execute the query on.
 * @param tokens  The tokens to fetch the balance of.
 * @param account  The account to query the balances of.
 * @param blockNumber  The block number to execute the query on.
 * @returns An array of query keys for react-query `useQuery` hook.
 */
export function balancesQueryKey(chainId: ChainId, tokens: string[], account: string, blockNumber: number) {
	return ["balances", chainId, tokens, account, blockNumber];
}
/**
 * @param tokenSymbol  The token symbol to check bridge fees for. 
 * @param amount  The amount to check bridge fees for.
 * @param blockNumber  The block number to execute the query on.
 * @returns An array of query keys for react-query `useQuery` hook.
 */
export function bridgeFeesQueryKey(tokenSymbol: string, amount: ethers.BigNumber, chainId: ChainId, blockNumber: number) {
	return ['bridgeFees', tokenSymbol, amount, chainId, blockNumber];
}
/**
 * Generates query keys for react-query `useQuery` hook, used in the `useAllowance` hook.
 * @param chainId  The chain Id of the chain to execute the query on.
 * @param token  The token to fetch the allowance of. 
 * @param owner  The owner in the allowance call. 
 * @param spender  The spender in the allowance call. 
 * @param blockNumber  The block number to execute the query on. 
 * @returns An array of query keys for react-query `useQuery` hook.
 */
export function allowanceQueryKey(chainId: ChainId, token: string, owner: string, spender: string, blockNumber: number) {
	return ["allowance", chainId, token, owner, spender, blockNumber];
}