import { PROVIDERS, ChainId, ETH_ADDRESS } from 'utils/constants';
import { clients } from '@uma/sdk';
import { ethers } from 'ethers';

/**
 * 
 * @param chainId The chain Id of the chain to query
 * @param token The token to fetch the balance of. 
 * @param account The account to query the balance of. 
 * @param blockNumber The preferred block number to execute the query.
 * @returns a Promise that resolves to the balance of the account
 */
export function getBalance(chainId: ChainId, token: string, account: string, blockNumber?: number): Promise<ethers.BigNumber> {
	const provider = PROVIDERS[chainId]();
	if (token === ETH_ADDRESS) {
		return provider.getBalance(account, blockNumber ?? "latest");
	}
	const contract = clients.erc20.connect(token, provider);
	return contract.balanceOf(account, { blockTag: blockNumber ?? "latest" })
}

// TODO: switch to a multicall implementation
/**
 * 
 * @param chainId The chain Id of the chain to query
 * @param tokens An array of tokens to fetch the balances of.
 * @param account The account to query the balances of.
 * @param blockNumber The preferred block number to execute the query.
 * @returns A Promise that resolves to an array of balances of the account
 */
export function getBalances(chainId: ChainId, tokens: string[], account: string, blockNumber?: number): Promise<ethers.BigNumber[]> {
	return Promise.all(tokens.map(token => getBalance(chainId, token, account, blockNumber)));
}