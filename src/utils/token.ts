import assert from "assert";
import { getProvider, ChainId, getConfig, toWeiSafe, formatUnits } from "utils";
import { clients } from "@uma/sdk";
import { ethers } from "ethers";
import { getAddress } from "./address";
import { TokenInfo, TokenInfoList } from "./utils.d";
import wethLogo from "assets/weth-logo.svg";
import ethereumLogo from "assets/ethereum-logo.svg";

export function getNativeBalance(
  chainId: ChainId,
  account: string,
  blockNumber: number | "latest" = "latest"
) {
  const provider = getProvider(chainId);

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
  blockNumber: number | "latest" = "latest"
): Promise<ethers.BigNumber> {
  const provider = getProvider(chainId);
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

export const tokenList: TokenInfoList = [
  {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
    logoURI: ethereumLogo,
    mainnetAddress: getAddress("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
  },
  {
    name: "Ether",
    symbol: "OETH",
    decimals: 18,
    logoURI: "/logos/ethereum-logo.svg",
    mainnetAddress: getAddress("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
  },
  {
    name: "Ether",
    symbol: "AETH",
    decimals: 18,
    logoURI: "/logos/ethereum-logo.svg",
    mainnetAddress: getAddress("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
  },
  {
    name: "Matic",
    symbol: "WMATIC",
    decimals: 18,
    logoURI: "/logos/ethereum-logo.svg",
    mainnetAddress: getAddress("0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0"),
  },
  {
    name: "Kovan Ethereum",
    symbol: "KOV",
    decimals: 18,
    logoURI: "/logos/ethereum-logo.svg",
    mainnetAddress: getAddress("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
  },
  {
    name: "Ether",
    symbol: "KOR",
    decimals: 18,
    logoURI: "/logos/ethereum-logo.svg",
    mainnetAddress: getAddress("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
  },
  {
    name: "Ether",
    symbol: "ARETH",
    decimals: 18,
    logoURI: "/logos/ethereum-logo.svg",
    mainnetAddress: getAddress("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
  },
  {
    name: "Wrapped Ether",
    symbol: "WETH",
    decimals: 18,
    logoURI: wethLogo,
    mainnetAddress: getAddress("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
  },
  {
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    logoURI: "/logos/usdc-logo.png",
    mainnetAddress: getAddress("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"),
  },
  {
    name: "Dai Stablecoin",
    symbol: "DAI",
    decimals: 18,
    logoURI: "/logos/dai-logo.png",
    mainnetAddress: getAddress("0x6B175474E89094C44Da98b954EedeAC495271d0F"),
  },
  {
    name: "Wrapped Bitcoin",
    symbol: "WBTC",
    decimals: 8,
    logoURI: "/logos/wbtc-logo.svg",
    mainnetAddress: getAddress("0x2260fac5e5542a773aa44fbcfedf7c193bc2c599"),
  },
  {
    name: "Boba",
    symbol: "BOBA",
    decimals: 18,
    logoURI: "/logos/boba-logo.svg",
    mainnetAddress: getAddress("0x42bbfa2e77757c645eeaad1655e0911a7553efbc"),
  },
  {
    name: "UMA",
    symbol: "UMA",
    decimals: 18,
    logoURI: "/logos/uma-logo.svg",
    mainnetAddress: getAddress("0x04Fa0d235C4abf4BcF4787aF4CF447DE572eF828"),
  },
  {
    name: "Matic",
    symbol: "MATIC",
    decimals: 18,
    logoURI: "/logos/ethereum-logo.svg",
    mainnetAddress: getAddress("0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0"),
  },
  {
    name: "Balancer",
    symbol: "BAL",
    decimals: 18,
    logoURI: "/logos/bal.svg",
    mainnetAddress: getAddress("0xba100000625a3754423978a60c9317c58a424e3D"),
  },
  {
    name: "USDT",
    symbol: "USDT",
    decimals: 6,
    logoURI: "/logos/usdt-logo.svg",
    mainnetAddress: getAddress("0xdAC17F958D2ee523a2206206994597C13D831ec7"),
  },
];

export const tokenTable = Object.fromEntries(
  tokenList.map((token) => {
    return [token.symbol, token];
  })
);

export const getToken = (symbol: string): TokenInfo => {
  const token = tokenTable[symbol];
  assert(token, "No token found for symbol: " + symbol);
  return token;
};
