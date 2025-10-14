import { BigNumber, ethers, utils } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { LifiToken } from "hooks/useAvailableCrosschainRoutes";

import {
  getProvider,
  ChainId,
  getConfig,
  getChainInfo,
  fixedPointAdjustment,
  parseUnits,
} from "utils";
import { ERC20__factory } from "utils/typechain";

export async function getNativeBalance(
  chainId: ChainId,
  account: string,
  blockNumber: number | "latest" = "latest",
  provider?:
    | ethers.providers.JsonRpcProvider
    | ethers.providers.FallbackProvider
) {
  provider ??= getProvider(chainId);
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
  blockNumber: number | "latest" = "latest",
  provider?:
    | ethers.providers.JsonRpcProvider
    | ethers.providers.FallbackProvider
): Promise<ethers.BigNumber> {
  provider ??= getProvider(chainId);
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
  blockNumber: number | "latest" = "latest",
  provider: ethers.providers.Provider = getProvider(chainId)
): Promise<ethers.BigNumber> {
  provider ??= getProvider(chainId);
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

/**
 * Converts a token amount to USD value
 * @param tokenAmount - The token amount as a string (decimal format)
 * @param token - The token object containing price and decimals
 * @returns The USD value as a BigNumber (18 decimals)
 */
export function convertTokenToUSD(
  tokenAmount: string,
  token: LifiToken
): BigNumber {
  const tokenScaled = parseUnits(tokenAmount, token.decimals);
  const priceScaled = parseUnits(token.priceUSD, token.decimals);
  return tokenScaled.mul(priceScaled).div(parseUnits("1", token.decimals));
}

/**
 * Converts a USD amount to token amount
 * @param usdAmount - The USD amount as a string (decimal format)
 * @param token - The token object containing price and decimals
 * @returns The token amount as a BigNumber
 */
export function convertUSDToToken(
  usdAmount: string,
  token: LifiToken
): BigNumber {
  const usdScaled = parseUnits(usdAmount, token.decimals);
  const priceScaled = parseUnits(token.priceUSD, token.decimals);
  return usdScaled.mul(parseUnits("1", token.decimals)).div(priceScaled);
}
