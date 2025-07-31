import { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";
import { constants } from "ethers";

import { getLogger, handleErrorCondition } from "../../_utils";

import mainnetChains from "../../../src/data/chains_1.json";
import { getRequestId, setRequestSpanAttributes } from "../../_request_utils";
import { sendResponse } from "../../_response_utils";
import { tracer, processor } from "../../../instrumentation";

const chains = mainnetChains;
const chainIds = chains.map((chain) => chain.chainId);

export default async function handler(
  request: VercelRequest,
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
      const [uniswapTokensResponse, lifiTokensResponse] = await Promise.all([
        axios.get("https://tokens.uniswap.org"),
        axios.get("https://li.quest/v1/tokens"),
      ]);
      const nativeTokens = getNativeTokensFromLifiTokens(
        lifiTokensResponse.data,
        chainIds
      );
      const pricesForLifiTokens = getPricesForLifiTokens(
        lifiTokensResponse.data,
        chainIds
      );

      const responseJson = uniswapTokensResponse.data.tokens.reduce(
        (acc: any, token: any) => {
          if (chainIds.includes(token.chainId)) {
            acc.push({
              chainId: token.chainId,
              address: token.address,
              name: token.name,
              symbol: token.symbol,
              decimals: token.decimals,
              logoUrl: token.logoURI,
              priceUsd:
                pricesForLifiTokens[token.chainId]?.[token.address] || null,
            });
          }
          return acc;
        },
        []
      );

      responseJson.push(
        ...nativeTokens.map((token: any) => ({
          chainId: token.chainId,
          address: token.address,
          name: token.name,
          symbol: token.symbol,
          decimals: token.decimals,
          logoUrl: token.logoURI,
          priceUsd: pricesForLifiTokens[token.chainId]?.[token.address] || null,
        }))
      );

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

function getNativeTokensFromLifiTokens(
  lifiTokensResponse: any,
  chainIds: number[]
) {
  return chainIds.reduce((acc, chainId) => {
    const nativeToken = lifiTokensResponse?.tokens?.[chainId]?.find(
      (token: any) => token.address === constants.AddressZero
    );
    if (nativeToken) {
      acc.push(nativeToken);
    }
    return acc;
  }, [] as any[]);
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
