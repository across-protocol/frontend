import { VercelResponse } from "@vercel/node";
import { constants } from "@across-protocol/sdk-v2";
import {
  getLogger,
  handleErrorCondition,
  getFallbackTokenLogoURI,
  ENABLED_ROUTES,
} from "./_utils";
import { TypedVercelRequest } from "./_types";

const handler = async (_: TypedVercelRequest<{}>, response: VercelResponse) => {
  const logger = getLogger();

  try {
    const tokensPerChain = ENABLED_ROUTES.routes.reduce(
      (acc, route) => {
        return {
          ...acc,
          [`${route.fromTokenSymbol}-${route.fromChain}`]: {
            symbol: route.fromTokenSymbol,
            chainId: route.fromChain,
            address: route.fromTokenAddress,
            isNative: route.isNative,
            l1TokenAddress: route.l1TokenAddress,
          },
        };
      },
      {} as Record<
        string,
        {
          symbol: string;
          chainId: number;
          address: string;
          isNative: boolean;
          l1TokenAddress: string;
        }
      >
    );

    const enrichedTokensPerChain = Object.values(tokensPerChain).map(
      (token) => {
        const tokenInfo =
          constants.TOKEN_SYMBOLS_MAP[
            token.symbol as keyof typeof constants.TOKEN_SYMBOLS_MAP
          ];
        return {
          ...token,
          name: tokenInfo.name,
          decimals: tokenInfo.decimals,
          logoURI: getFallbackTokenLogoURI(token.l1TokenAddress),
        };
      }
    );

    // Two different explanations for how `stale-while-revalidate` works:

    // https://vercel.com/docs/concepts/edge-network/caching#stale-while-revalidate
    // This tells our CDN the value is fresh for 6 hours. If a request is repeated within the next 6 hours,
    // the previously cached value is still fresh. The header x-vercel-cache present in the response will show the
    // value HIT. If the request is repeated up to 6 hours later, the cached value will be stale but
    // still render. In the background, a revalidation request will be made to populate the cache with a fresh value.
    // x-vercel-cache will have the value STALE until the cache is refreshed.

    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
    // The response is fresh for 6 hours. After 6 hours it becomes stale, but the cache is allowed to reuse it
    // for any requests that are made in the following 6 hours, provided that they revalidate the response in the background.
    // Revalidation will make the cache be fresh again, so it appears to clients that it was always fresh during
    // that period — effectively hiding the latency penalty of revalidation from them.
    // If no request happened during that period, the cache became stale and the next request will revalidate normally.
    logger.debug({
      at: "TokenList",
      message: "Response data",
      responseJson: enrichedTokensPerChain,
    });
    response.setHeader(
      "Cache-Control",
      "s-maxage=21600, stale-while-revalidate=21600"
    );
    response.status(200).json(enrichedTokensPerChain);
  } catch (error: unknown) {
    return handleErrorCondition("token-list", response, logger, error);
  }
};

export default handler;
