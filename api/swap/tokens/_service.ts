import axios from "axios";
import { constants } from "ethers";
import mainnetChains from "../../../src/data/chains_1.json";
import indirectChains from "../../../src/data/indirect_chains_1.json";
import { CHAIN_IDs } from "../../_constants";

export type SwapToken = {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoUrl: string;
  priceUsd: string | null;
};

const chains = mainnetChains;
const chainIds = [...chains, ...indirectChains].map((chain) => chain.chainId);

// List of tokens that are statically defined locally
const staticTokens = indirectChains.flatMap((chain) =>
  chain.outputTokens.map((token) => ({
    chainId: chain.chainId,
    address: token.address,
    name: token.name,
    symbol: token.symbol,
    decimals: token.decimals,
    logoUrl: token.logoUrl,
    priceUsd: token.symbol === "USDT-SPOT" ? "1" : null,
  }))
);

function getUniswapTokens(
  uniswapResponse: any,
  chainIds: number[],
  pricesForLifiTokens: Record<number, Record<string, string>>
): SwapToken[] {
  return uniswapResponse.tokens.reduce((acc: SwapToken[], token: any) => {
    if (chainIds.includes(token.chainId)) {
      acc.push({
        chainId: token.chainId,
        address: token.address,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        logoUrl: token.logoURI,
        priceUsd: pricesForLifiTokens[token.chainId]?.[token.address] || null,
      });
    }
    return acc;
  }, []);
}

function getNativeTokensFromLifiTokens(
  lifiTokensResponse: any,
  chainIds: number[],
  pricesForLifiTokens: Record<number, Record<string, string>>
): SwapToken[] {
  return chainIds.reduce((acc: SwapToken[], chainId) => {
    const nativeToken = lifiTokensResponse?.tokens?.[chainId]?.find(
      (token: any) => token.address === constants.AddressZero
    );
    if (nativeToken) {
      acc.push({
        chainId,
        address: nativeToken.address,
        name: nativeToken.name,
        symbol: nativeToken.symbol,
        decimals: nativeToken.decimals,
        logoUrl: nativeToken.logoURI,
        priceUsd: pricesForLifiTokens[chainId]?.[nativeToken.address] || null,
      });
    }
    return acc;
  }, []);
}

function getPricesForLifiTokens(lifiTokensResponse: any, chainIds: number[]) {
  return chainIds.reduce(
    (acc, chainId) => {
      const tokens = lifiTokensResponse.tokens[chainId];
      if (!tokens) {
        return acc;
      }
      tokens.forEach((token: any) => {
        if (!acc[chainId]) {
          acc[chainId] = {};
        }
        acc[chainId][token.address] = token.priceUSD;
      });
      return acc;
    },
    {} as Record<number, Record<string, string>>
  );
}

function getJupiterTokens(
  jupiterTokensResponse: any[],
  chainIds: number[]
): SwapToken[] {
  if (!chainIds.includes(CHAIN_IDs.SOLANA)) {
    return [];
  }

  return jupiterTokensResponse.reduce((acc: SwapToken[], token: any) => {
    if (token.organicScoreLabel === "high") {
      acc.push({
        chainId: CHAIN_IDs.SOLANA,
        address: token.id,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        logoUrl: token.icon,
        priceUsd: token.usdPrice?.toString() || null,
      });
    }
    return acc;
  }, []);
}

function getStaticTokens(chainIds: number[]): SwapToken[] {
  return staticTokens.filter((token) => chainIds.includes(token.chainId));
}

export async function fetchSwapTokensData(
  filteredChainIds?: number[]
): Promise<SwapToken[]> {
  const targetChainIds = filteredChainIds || chainIds;

  const [uniswapTokensResponse, lifiTokensResponse, jupiterTokensResponse] =
    await Promise.all([
      axios.get("https://tokens.uniswap.org"),
      axios.get("https://li.quest/v1/tokens"),
      axios.get("https://lite-api.jup.ag/tokens/v2/toporganicscore/24h"),
    ]);

  const pricesForLifiTokens = getPricesForLifiTokens(
    lifiTokensResponse.data,
    targetChainIds
  );

  const responseJson: SwapToken[] = [];

  // Add Uniswap tokens
  const uniswapTokens = getUniswapTokens(
    uniswapTokensResponse.data,
    targetChainIds,
    pricesForLifiTokens
  );
  responseJson.push(...uniswapTokens);

  // Add native tokens from LiFi
  const nativeTokens = getNativeTokensFromLifiTokens(
    lifiTokensResponse.data,
    targetChainIds,
    pricesForLifiTokens
  );
  responseJson.push(...nativeTokens);

  // Add Jupiter tokens
  const jupiterTokens = getJupiterTokens(
    jupiterTokensResponse.data,
    targetChainIds
  );
  responseJson.push(...jupiterTokens);

  // Add static tokens
  const staticTokens = getStaticTokens(targetChainIds);
  responseJson.push(...staticTokens);

  return responseJson;
}
