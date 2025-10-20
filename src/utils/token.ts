import { BigNumber, ethers } from "ethers";
import { LifiToken } from "hooks/useAvailableCrosschainRoutes";

import {
  getProvider,
  ChainId,
  getConfig,
  getChainInfo,
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

// Standard precision for intermediate calculations (matches Ethereum wei)
const PRECISION = 18;

/**
 * Limits a decimal string to a maximum number of decimal places without losing precision
 * @param value - The decimal string to limit
 * @param maxDecimals - Maximum number of decimal places
 * @returns The limited string
 */
function limitDecimals(value: string, maxDecimals: number): string {
  const parts = value.split(".");
  if (parts.length === 1) {
    return value; // No decimal point
  }
  if (parts[1].length <= maxDecimals) {
    return value; // Within limits
  }
  return parts[0] + "." + parts[1].substring(0, maxDecimals);
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
  // Use 18 decimals for maximum precision in calculations
  const normalizedAmount = limitDecimals(tokenAmount, PRECISION);
  const tokenScaled = parseUnits(normalizedAmount, PRECISION);
  const priceScaled = parseUnits(token.priceUSD, PRECISION);
  return tokenScaled.mul(priceScaled).div(parseUnits("1", PRECISION));
}

/**
 * Converts a USD amount to token amount
 * @param usdAmount - The USD amount as a string (decimal format)
 * @param token - The token object containing price and decimals
 * @returns The token amount as a BigNumber (in token's native decimals)
 */
export function convertUSDToToken(
  usdAmount: string,
  token: LifiToken
): BigNumber {
  // Use 18 decimals for maximum precision in calculations
  const normalizedAmount = limitDecimals(usdAmount, PRECISION);
  const usdScaled = parseUnits(normalizedAmount, PRECISION);
  const priceScaled = parseUnits(token.priceUSD, PRECISION);
  const result18Dec = usdScaled
    .mul(parseUnits("1", PRECISION))
    .div(priceScaled);

  // Convert from 18 decimals to token's native decimals
  const decimalDiff = PRECISION - token.decimals;
  if (decimalDiff > 0) {
    return result18Dec.div(BigNumber.from(10).pow(decimalDiff));
  } else if (decimalDiff < 0) {
    return result18Dec.mul(BigNumber.from(10).pow(-decimalDiff));
  }
  return result18Dec;
}
