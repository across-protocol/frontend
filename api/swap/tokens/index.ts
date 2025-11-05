import { VercelResponse } from "@vercel/node";
import axios from "axios";
import { constants } from "ethers";
import { type, assert, Infer, optional, array, union } from "superstruct";

import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../_constants";
import { getRequestId, setRequestSpanAttributes } from "../../_request_utils";
import { sendResponse } from "../../_response_utils";
import { TypedVercelRequest } from "../../_types";
import {
  ENABLED_ROUTES,
  getChainInfo,
  getFallbackTokenLogoURI,
  getLogger,
  handleErrorCondition,
  paramToArray,
  positiveIntStr,
} from "../../_utils";
import { tracer, processor } from "../../../instrumentation";
import mainnetChains from "../../../src/data/chains_1.json";
import indirectChains from "../../../src/data/indirect_chains_1.json";

type Token = {
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

// Chains where USDT should be displayed as USDT0
// Temporary list until all chains migrate to USDT0
const chainsWithUsdt0Enabled = [
  CHAIN_IDs.POLYGON,
  CHAIN_IDs.ARBITRUM,
  CHAIN_IDs.HYPEREVM,
  CHAIN_IDs.PLASMA,
];

// USDT0 logo URL (matches frontend logo)
const USDT0_LOGO_URL = "https://across.to/logo-assets/usdt0.svg";

const SwapTokensQueryParamsSchema = type({
  chainId: optional(union([positiveIntStr(), array(positiveIntStr())])),
});

type SwapTokensQueryParams = Infer<typeof SwapTokensQueryParamsSchema>;

export default async function handler(
  request: TypedVercelRequest<SwapTokensQueryParams>,
  response: VercelResponse
) {
  const logger = getLogger();
  const requestId = getRequestId(request);
  logger.debug({
    at: "swap/tokens",
    message: "Request data",
    requestId,
  });
  return tracer.startActiveSpan("swap/tokens", async (span) => {
    setRequestSpanAttributes(request, span, requestId);

    try {
      const { query } = request;
      assert(query, SwapTokensQueryParamsSchema);

      const { chainId } = query;
      const filteredChainIds = chainId
        ? paramToArray(chainId)?.map(Number) || chainIds
        : chainIds;

      const [uniswapTokensResponse, lifiTokensResponse, jupiterTokensResponse] =
        await Promise.all([
          axios.get("https://tokens.uniswap.org"),
          axios.get("https://li.quest/v1/tokens"),
          axios.get("https://lite-api.jup.ag/tokens/v2/toporganicscore/24h"),
        ]);
      const pricesForLifiTokens = getPricesForLifiTokens(
        lifiTokensResponse.data,
        filteredChainIds
      );

      const responseJson: Token[] = [];

      // Add tokens from Across' enabled routes first (highest priority for normalized names)
      const tokensFromEnabledRoutes = getTokensFromEnabledRoutes(
        filteredChainIds,
        pricesForLifiTokens
      );
      responseJson.push(...tokensFromEnabledRoutes);

      // Add tokens from indirect chains (e.g., USDT-SPOT on HyperCore)
      const indirectChainTokens = getIndirectChainTokens(
        filteredChainIds,
        pricesForLifiTokens
      );
      responseJson.push(...indirectChainTokens);

      // Add Uniswap tokens
      const uniswapTokens = getUniswapTokens(
        uniswapTokensResponse.data,
        filteredChainIds,
        pricesForLifiTokens
      );
      responseJson.push(...uniswapTokens);

      // Add native tokens from LiFi
      const nativeTokens = getNativeTokensFromLifiTokens(
        lifiTokensResponse.data,
        filteredChainIds,
        pricesForLifiTokens
      );
      responseJson.push(...nativeTokens);

      // Add Jupiter tokens
      const jupiterTokens = getJupiterTokens(
        jupiterTokensResponse.data,
        filteredChainIds
      );
      responseJson.push(...jupiterTokens);

      // Deduplicate tokens (Across tokens take precedence)
      const deduplicatedTokens = deduplicateTokens(responseJson);

      logger.debug({
        at: "swap/tokens",
        message: "Response data",
        responseJson: deduplicatedTokens,
      });
      sendResponse({
        response,
        body: deduplicatedTokens,
        statusCode: 200,
        requestId,
        cacheSeconds: 60 * 5,
        staleWhileRevalidateSeconds: 60 * 5,
      });
    } catch (error: unknown) {
      return handleErrorCondition(
        "swap/tokens",
        response,
        logger,
        error,
        span,
        requestId
      );
    } finally {
      span.end();
      processor.forceFlush();
    }
  });
}

function getUniswapTokens(
  uniswapResponse: any,
  chainIds: number[],
  pricesForLifiTokens: Record<number, Record<string, string>>
): Token[] {
  return uniswapResponse.tokens.reduce((acc: Token[], token: any) => {
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
): Token[] {
  return chainIds.reduce((acc: Token[], chainId) => {
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
  ); // chainId -> tokenAddress -> price
}

function getJupiterTokens(
  jupiterTokensResponse: any[],
  chainIds: number[]
): Token[] {
  if (!chainIds.includes(CHAIN_IDs.SOLANA)) {
    return [];
  }

  return jupiterTokensResponse.reduce((acc: Token[], token: any) => {
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
): Token[] {
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
): Token[] {
  const tokens: Token[] = [];
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

function deduplicateTokens(tokens: Token[]): Token[] {
  const seen = new Map<string, Token>();

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
