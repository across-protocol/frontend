import { getProvider, ChainId, getConfig, toWeiSafe, formatUnits } from "utils";
import { clients } from "@uma/sdk";
import { ethers } from "ethers";

export function getNativeBalance(
  chainId: ChainId,
  account: string,
  blockNumber: number | "latest" = "latest",
  testProvider?: ethers.providers.Web3Provider
) {
  const provider = testProvider ?? getProvider(chainId);

  return provider.getBalance(account, blockNumber);
}
/**
 *
 * @param chainId The chain Id of the chain to query
 * @param token The token to fetch the balance of.
 * @param account The account to query the balance of.
 * @param blockNumber The block number to execute the query.
 * @returns a Promise that resolves to the balance of the account
 */
export function getBalance(
  chainId: ChainId,
  account: string,
  tokenAddress: string,
  blockNumber: number | "latest" = "latest",
  testProvider?: ethers.providers.Web3Provider
): Promise<ethers.BigNumber> {
  const provider = testProvider ?? getProvider(chainId);
  const contract = clients.erc20.connect(tokenAddress, provider);
  return contract.balanceOf(account, { blockTag: blockNumber });
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
  const contract = clients.erc20.connect(address, provider);
  return contract.allowance(owner, spender, { blockTag: blockNumber });
}

export const calculateRemoveAmount = (
  percent: number,
  position: ethers.BigNumber,
  decimals: number
) => {
  if (position.toString() === "0") return "0";
  const scaler = ethers.BigNumber.from("10").pow(decimals);

  const removeAmountToWei = toWeiSafe(percent.toString(), decimals);

  const weiAmount = position.mul(removeAmountToWei).div(scaler.mul(100));
  return formatUnits(weiAmount, decimals);
};
