import axios from "axios";
import { constants } from "ethers";
import mainnetChains from "../../../src/data/chains_1.json";
import indirectChains from "../../../src/data/indirect_chains_1.json";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../_constants";
import {
  ENABLED_ROUTES,
  getChainInfo,
  getFallbackTokenLogoURI,
} from "../../_utils";

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

function getIndirectChainTokens(
  chainIds: number[],
  pricesForLifiTokens: Record<number, Record<string, string>>
): SwapToken[] {
  // Chain ID to use for token price lookups
  const PRICE_LOOKUP_CHAIN_ID = CHAIN_IDs.MAINNET;

  return indirectChains.flatMap((chain) => {
    if (!chainIds.includes(chain.chainId)) {
      return [];
    }

    return chain.outputTokens.map((token) => {
      // Try to resolve price using L1 address from TOKEN_SYMBOLS_MAP
      let priceUsd: string | null = null;
      const tokenInfo =
        TOKEN_SYMBOLS_MAP[token.symbol as keyof typeof TOKEN_SYMBOLS_MAP];

      if (tokenInfo) {
        // Get L1 address
        const l1Address = tokenInfo.addresses[PRICE_LOOKUP_CHAIN_ID];
        if (l1Address) {
          priceUsd =
            pricesForLifiTokens[PRICE_LOOKUP_CHAIN_ID]?.[l1Address] || null;
        }
      }

      return {
        chainId: chain.chainId,
        address: token.address,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        logoUrl: token.logoUrl,
        priceUsd,
      };
    });
  });
}

function getTokensFromEnabledRoutes(
  chainIds: number[],
  pricesForLifiTokens: Record<number, Record<string, string>>
): SwapToken[] {
  const tokens: SwapToken[] = [];
  const seenTokens = new Set<string>();

  const addToken = (
    chainId: number,
    tokenSymbol: string,
    tokenAddress: string,
    l1TokenAddress: string,
    isNative: boolean
  ) => {
    const finalAddress = isNative ? constants.AddressZero : tokenAddress;

    const tokenKey = `${chainId}-${tokenSymbol}-${finalAddress.toLowerCase()}`;

    // Only add each unique token once
    if (!seenTokens.has(tokenKey)) {
      seenTokens.add(tokenKey);

      const tokenInfo =
        TOKEN_SYMBOLS_MAP[tokenSymbol as keyof typeof TOKEN_SYMBOLS_MAP];

      tokens.push({
        chainId,
        address: finalAddress,
        name: tokenInfo.name,
        symbol: tokenSymbol,
        decimals: tokenInfo.decimals,
        logoUrl: getFallbackTokenLogoURI(l1TokenAddress),
        priceUsd: pricesForLifiTokens[chainId]?.[finalAddress] || null,
      });
    }
  };

  ENABLED_ROUTES.routes.forEach((route) => {
    // Process origin tokens (fromChain)
    if (chainIds.includes(route.fromChain)) {
      addToken(
        route.fromChain,
        route.fromTokenSymbol,
        route.fromTokenAddress,
        route.l1TokenAddress,
        route.isNative
      );
    }

    // Process destination tokens (toChain)
    if (chainIds.includes(route.toChain)) {
      // For destination tokens, check if token is native on that chain
      const chainInfo = getChainInfo(route.toChain);
      const nativeSymbol =
        route.toChain === CHAIN_IDs.LENS ? "GHO" : chainInfo.nativeToken;
      const isDestinationNative = route.toTokenSymbol === nativeSymbol;

      addToken(
        route.toChain,
        route.toTokenSymbol,
        route.toTokenAddress,
        route.l1TokenAddress,
        isDestinationNative
      );
    }
  });

  return tokens;
}

function deduplicateTokens(tokens: SwapToken[]): SwapToken[] {
  const seen = new Map<string, SwapToken>();

  tokens.forEach((token) => {
    const key = `${token.chainId}-${token.symbol}-${token.address.toLowerCase()}`;

    // Keep first occurrence
    if (!seen.has(key)) {
      seen.set(key, token);
    }
  });

  return Array.from(seen.values());
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

  // Add tokens from indirect chains (e.g., USDT-SPOT on HyperCore)
  const indirectChainTokens = getIndirectChainTokens(
    targetChainIds,
    pricesForLifiTokens
  );
  responseJson.push(...indirectChainTokens);

  // Add tokens from Across' enabled routes (fills gaps from external sources)
  const tokensFromEnabledRoutes = getTokensFromEnabledRoutes(
    targetChainIds,
    pricesForLifiTokens
  );
  responseJson.push(...tokensFromEnabledRoutes);

  // Deduplicate tokens (external sources take precedence)
  const deduplicatedTokens = deduplicateTokens(responseJson);

  return deduplicatedTokens;
}
