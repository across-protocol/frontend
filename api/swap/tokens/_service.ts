import axios from "axios";
import { constants } from "ethers";
import mainnetChains from "../../../src/data/chains_1.json";
import indirectChainsImport from "../../../src/data/indirect_chains_1.json";
import {
  CHAIN_IDs,
  TOKEN_SYMBOLS_MAP,
  TOKEN_EQUIVALENCE_REMAPPING,
} from "../../_constants";
import { getChainInfo, getFallbackTokenLogoURI } from "../../_utils";
import { TOKEN_LOGO_URLS } from "./_logo-urls";

// Type cast to avoid TypeScript inferring never[] when indirect_chains_1.json is empty.
// Uses the same structure as mainnetChains since indirect chains share the same base schema.
const indirectChains = indirectChainsImport as typeof mainnetChains;

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

// Chains where USDT should be displayed as USDT0
// Temporary list until all chains migrate to USDT0
const chainsWithUsdt0Enabled = [
  CHAIN_IDs.POLYGON,
  CHAIN_IDs.ARBITRUM,
  CHAIN_IDs.HYPEREVM,
  CHAIN_IDs.PLASMA,
];

// USDT0 logo URL (matches frontend logo)
const USDT0_LOGO_URL =
  "https://raw.githubusercontent.com/across-protocol/frontend/master/src/assets/token-logos/usdt0.svg";

function getTokensFromConstants(
  chainIds: number[],
  pricesForLifiTokens: Record<number, Record<string, string>>
): SwapToken[] {
  const tokens: SwapToken[] = [];
  const seenTokens = new Set<string>();

  const addToken = (
    chainId: number,
    tokenSymbol: string,
    tokenAddress: string,
    isNative: boolean
  ) => {
    const finalAddress = isNative ? constants.AddressZero : tokenAddress;

    const tokenInfo =
      TOKEN_SYMBOLS_MAP[tokenSymbol as keyof typeof TOKEN_SYMBOLS_MAP];
    const equivalentTokenSymbol = TOKEN_EQUIVALENCE_REMAPPING[tokenSymbol];
    const l1TokenAddress = equivalentTokenSymbol
      ? TOKEN_SYMBOLS_MAP[
          equivalentTokenSymbol as keyof typeof TOKEN_SYMBOLS_MAP
        ].addresses[CHAIN_IDs.MAINNET]
      : tokenInfo.addresses[CHAIN_IDs.MAINNET] || tokenAddress;

    // Apply chain-specific display transformations
    let displaySymbol = tokenSymbol;
    let displayName = tokenInfo.name;
    let displayLogoUrl =
      TOKEN_LOGO_URLS[tokenSymbol] || getFallbackTokenLogoURI(l1TokenAddress);

    // Handle USDT -> USDT0 for specific chains
    if (tokenSymbol === "USDT" && chainsWithUsdt0Enabled.includes(chainId)) {
      displaySymbol = "USDT0";
      displayName = "USDT0";
      displayLogoUrl = USDT0_LOGO_URL;
    }

    if (
      // Only add SPOT tokens for HyperCore
      (tokenSymbol.includes("-SPOT") && chainId !== CHAIN_IDs.HYPERCORE) ||
      // Only add BNB tokens for BSC
      (tokenSymbol.includes("-BNB") && chainId !== CHAIN_IDs.BSC)
    ) {
      return;
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

  Object.values(TOKEN_SYMBOLS_MAP).forEach((tokenInfo) => {
    Object.entries(tokenInfo.addresses).forEach(([chainId, address]) => {
      if (chainIds.includes(Number(chainId))) {
        const chainInfo = getChainInfo(Number(chainId));
        const isNative = tokenInfo.symbol === chainInfo.nativeToken;
        addToken(Number(chainId), tokenInfo.symbol, address, isNative);
      }
    });
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
  const tokensFromEnabledRoutes = getTokensFromConstants(
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
