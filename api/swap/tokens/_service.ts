import axios from "axios";
import { constants } from "ethers";
import mainnetChains from "../../../src/data/chains_1.json";
import indirectChainsImport from "../../../src/data/indirect_chains_1.json";
import {
  CHAIN_IDs,
  TOKEN_SYMBOLS_MAP,
  TOKEN_EQUIVALENCE_REMAPPING,
} from "../../_constants";
import {
  ENABLED_ROUTES,
  getChainInfo,
  getFallbackTokenLogoURI,
} from "../../_utils";

// Type cast to avoid TypeScript inferring never[] when indirect_chains_1.json is empty.
// Uses the same structure as mainnetChains since indirect chains share the same base schema.
const indirectChains = indirectChainsImport as Array<
  (typeof mainnetChains)[number] & {
    intermediaryChain: number;
  }
>;
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

// Using hardcoded value until https://github.com/across-protocol/frontend/pull/1988 merged
const USDH_LOGO_URL =
  "https://coin-images.coingecko.com/coins/images/69484/large/usdh.png?1758728903";

function getIndirectChainTokens(
  chainIds: number[],
  pricesForLifiTokens: Record<number, Record<string, string>>
): SwapToken[] {
  return indirectChains.flatMap((chain) => {
    if (!chainIds.includes(chain.chainId)) {
      return [];
    }

    return chain.outputTokens.map((token) => {
      // Try to resolve price using equivalent token
      let priceUsd: string | null = null;
      const equivalentTokenSymbol =
        TOKEN_EQUIVALENCE_REMAPPING[token.symbol] || token.symbol;
      const tokenInfo =
        TOKEN_SYMBOLS_MAP[
          equivalentTokenSymbol as keyof typeof TOKEN_SYMBOLS_MAP
        ];

      if (tokenInfo) {
        const l1Address = tokenInfo.addresses[CHAIN_IDs.MAINNET];
        if (l1Address) {
          priceUsd =
            pricesForLifiTokens[CHAIN_IDs.MAINNET]?.[l1Address] || null;
        } else {
          const intermediaryAddress =
            tokenInfo.addresses[chain.intermediaryChain];
          priceUsd =
            pricesForLifiTokens[chain.intermediaryChain]?.[
              intermediaryAddress
            ] || null;
        }
      }

      let logoUrl = token.logoUrl;
      if (token.symbol === "USDH-SPOT") {
        logoUrl = USDH_LOGO_URL;
      }

      return {
        chainId: chain.chainId,
        address: token.address,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        logoUrl,
        priceUsd,
      };
    });
  });
}

// Chains where USDT should be displayed as USDT0
// Temporary list until all chains migrate to USDT0
const chainsWithUsdt0Enabled = [
  CHAIN_IDs.POLYGON,
  CHAIN_IDs.ARBITRUM,
  CHAIN_IDs.HYPEREVM,
  CHAIN_IDs.PLASMA,
  CHAIN_IDs.MONAD,
  CHAIN_IDs.UNICHAIN,
];

// USDT0 logo URL (matches frontend logo)
const USDT0_LOGO_URL =
  "https://raw.githubusercontent.com/across-protocol/frontend/master/src/assets/token-logos/usdt0.svg";

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

    const tokenInfo =
      TOKEN_SYMBOLS_MAP[tokenSymbol as keyof typeof TOKEN_SYMBOLS_MAP];

    // Apply chain-specific display transformations
    let displaySymbol = tokenSymbol;
    let displayName = tokenInfo.name;
    let displayLogoUrl = getFallbackTokenLogoURI(l1TokenAddress);

    // Handle USDT -> USDT0 for specific chains
    if (tokenSymbol === "USDT" && chainsWithUsdt0Enabled.includes(chainId)) {
      displaySymbol = "USDT0";
      displayName = "USDT0";
      displayLogoUrl = USDT0_LOGO_URL;
    }

    // Use display symbol for deduplication key
    const tokenKey = `${chainId}-${displaySymbol}-${finalAddress.toLowerCase()}`;

    // Only add each unique token once
    if (!seenTokens.has(tokenKey)) {
      seenTokens.add(tokenKey);

      tokens.push({
        chainId,
        address: finalAddress,
        name: displayName,
        symbol: displaySymbol,
        decimals: tokenInfo.decimals,
        logoUrl: displayLogoUrl,
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

    // Skip USDT on chains with USDT0 enabled (USDT0 comes first from Across tokens)
    if (
      token.symbol === "USDT" &&
      chainsWithUsdt0Enabled.includes(token.chainId)
    ) {
      const usdt0Key = `${token.chainId}-USDT0-${token.address.toLowerCase()}`;
      if (seen.has(usdt0Key)) return; // Skip this USDT, we already have USDT0
    }

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

  // Add tokens from Across' enabled routes first (highest priority for normalized names)
  const tokensFromEnabledRoutes = getTokensFromEnabledRoutes(
    targetChainIds,
    pricesForLifiTokens
  );
  responseJson.push(...tokensFromEnabledRoutes);

  // Add tokens from indirect chains (e.g., USDT-SPOT on HyperCore)
  const indirectChainTokens = getIndirectChainTokens(
    targetChainIds,
    pricesForLifiTokens
  );
  responseJson.push(...indirectChainTokens);

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

  // Deduplicate tokens (Across tokens take precedence)
  const deduplicatedTokens = deduplicateTokens(responseJson);

  return deduplicatedTokens;
}
