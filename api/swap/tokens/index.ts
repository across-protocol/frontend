import { VercelResponse } from "@vercel/node";
import axios from "axios";
import { constants } from "ethers";
import { type, assert, Infer, optional, array, union } from "superstruct";

import {
  getLogger,
  handleErrorCondition,
  paramToArray,
  positiveIntStr,
} from "../../_utils";
import { TypedVercelRequest } from "../../_types";

import mainnetChains from "../../../src/data/chains_1.json";
import indirectChains from "../../../src/data/indirect_chains_1.json";
import { getRequestId, setRequestSpanAttributes } from "../../_request_utils";
import { sendResponse } from "../../_response_utils";
import { tracer, processor } from "../../../instrumentation";
import { CHAIN_IDs } from "../../_constants";

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
const chainIds = chains.map((chain) => chain.chainId);

// List of tokens that are statically defined locally. Currently, this list is used for
// indirect chain tokens, e.g. USDT-SPOT on HyperCore.
const staticTokens = indirectChains.flatMap((chain) =>
  chain.outputTokens.map((token) => ({
    chainId: chain.chainId,
    address: token.address,
    name: token.name,
    symbol: token.symbol,
    decimals: token.decimals,
    logoUrl: token.logoUrl,
    // TODO: Add more generic price resolution logic for static tokens
    priceUsd: token.symbol === "USDT-SPOT" ? "1" : null,
  }))
);

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

      // Add static tokens
      const staticTokens = getStaticTokens(filteredChainIds);
      responseJson.push(...staticTokens);

      logger.debug({
        at: "swap/tokens",
        message: "Response data",
        responseJson,
      });
      sendResponse({
        response,
        body: responseJson,
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

function getStaticTokens(chainIds: number[]): Token[] {
  return staticTokens.filter((token) => chainIds.includes(token.chainId));
}
