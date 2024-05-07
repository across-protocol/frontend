import { ethers } from "ethers";

import { getProvider, ChainId, getConfig, getChainInfo } from "utils";
import { ERC20__factory } from "utils/typechain";

export async function getNativeBalance(
  chainId: ChainId,
  account: string,
  blockNumber: number | "latest" = "latest"
) {
  const provider = getProvider(chainId);
  const balance = await provider.getBalance(account, blockNumber);
  return balance;
}
/**
 *
 * @param chainId The chain Id of the chain to query
 * @param token The token to fetch the balance of.
 * @param account The account to query the balance of.
 * @param blockNumber The block number to execute the query.
 * @returns a Promise that resolves to the balance of the account
 */
export async function getBalance(
  chainId: ChainId,
  account: string,
  tokenAddress: string,
  blockNumber: number | "latest" = "latest"
): Promise<ethers.BigNumber> {
  const provider = getProvider(chainId);
  const contract = ERC20__factory.connect(tokenAddress, provider);
  const balance = await contract.balanceOf(account, { blockTag: blockNumber });
  return balance;
}

/**
 *
 * @param chainId  The chain Id of the chain to query
 * @param token  The token to fetch the allowance of.
 * @param owner  The owner in the allowance call.
 * @param spender The spender in the allowance call.
 * @param blockNumber The block number to execute the query.
 * @returns A Promise that resolves to the allowance of `spender` for the tokens of `owner`.
 */
export async function getAllowance(
  chainId: ChainId,
  owner: string,
  spender: string,
  tokenSymbol: string,
  blockNumber: number | "latest" = "latest"
): Promise<ethers.BigNumber> {
  const provider = getProvider(chainId);
  const config = getConfig();
  const { isNative, address } = config.getTokenInfoBySymbol(
    chainId,
    tokenSymbol
  );
  // For a native gas token, allowance does not make sense
  if (isNative) {
    return ethers.constants.MaxUint256;
  }
  const contract = ERC20__factory.connect(address, provider);
  return contract.allowance(owner, spender, { blockTag: blockNumber });
}

export function getExplorerLinkForToken(
  tokenAddress: string,
  tokenChainId: number
) {
  return `${getChainInfo(tokenChainId).explorerUrl}/address/${tokenAddress}`;
}
