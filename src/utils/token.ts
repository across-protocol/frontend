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
import { SwapToken } from "utils/serverless-api/types";
import { TokenInfo } from "constants/tokens";
import {
  CHAIN_IDs,
  chainsWithUsdt0Enabled,
  getToken,
  tokenTable,
} from "utils/constants";
import usdt0Logo from "assets/token-logos/usdt0.svg";

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

/**
 * Gets token info with chain-specific display modifications (temporary for USDT0)
 * This is a temporary function that will be removed once all chains migrate to USDT0
 */
export const getTokenForChain = (
  symbol: string,
  chainId: number
): TokenInfo => {
  const token = getToken(symbol);

  // Handle USDT -> USDT0 display for specific chains
  if (token.symbol === "USDT" && chainsWithUsdt0Enabled.includes(chainId)) {
    return {
      ...token,
      displaySymbol: "USDT0",
      logoURI: usdt0Logo,
    };
  }

  return token;
};

/**
 * Attempts to coerce a SwapToken into a TokenInfo type
 * Checks local token definitions to enrich with mainnetAddress and displaySymbol
 * @param swapToken - The SwapToken to convert
 * @returns A TokenInfo object with available properties mapped
 */
export function swapTokenToTokenInfo(swapToken: SwapToken): TokenInfo {
  // Try to find the token in our local token definitions
  const localToken = tokenTable?.[swapToken.symbol.toUpperCase()];

  const baseTokenInfo: TokenInfo = {
    name: swapToken.name,
    symbol: swapToken.symbol,
    decimals: swapToken.decimals,
    logoURI: swapToken.logoUrl || "",
    addresses: {
      [swapToken.chainId]: swapToken.address,
    },
  };

  // If we found a local token definition, merge in mainnetAddress and displaySymbol
  if (localToken) {
    return {
      ...baseTokenInfo,
      mainnetAddress: localToken.mainnetAddress,
      displaySymbol: localToken.displaySymbol,
      logoURI: localToken.logoURI || baseTokenInfo.logoURI, // Prefer local logo if available
    };
  }

  return baseTokenInfo;
}
