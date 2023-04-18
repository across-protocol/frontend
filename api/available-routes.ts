import { VercelResponse } from "@vercel/node";
import { object, assert, Infer, optional } from "superstruct";
import {
  getLogger,
  handleErrorCondition,
  applyMapFilter,
  validAddress,
  positiveIntStr,
  ENABLED_ROUTES,
} from "./_utils";
import { TypedVercelRequest } from "./_types";

const AvailableRoutesQueryParamsSchema = object({
  originToken: optional(validAddress()),
  destinationToken: optional(validAddress()),
  destinationChainId: optional(positiveIntStr()),
  originChainId: optional(positiveIntStr()),
});

type AvailableRoutesQueryParams = Infer<
  typeof AvailableRoutesQueryParamsSchema
>;

type L1TokenMapRouting = Record<string, Record<string, string>>;

const handler = async (
  { query }: TypedVercelRequest<AvailableRoutesQueryParams>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "Routes",
    message: "Query data",
    query,
  });
  try {
    assert(query, AvailableRoutesQueryParamsSchema);
    const { originToken, destinationToken, originChainId, destinationChainId } =
      query;

    // Generate a mapping that contains similar tokens on each chain
    // Note:  The key in this dictionary represents an l1Token address, and
    //        the corresponding value is a nested hashmap containing a key
    //        value pair of {chainId: l2TokenEquivalent}
    const l1TokensToDestinationTokens: L1TokenMapRouting = {};
    for (const {
      l1TokenAddress,
      fromChain,
      fromTokenAddress,
    } of ENABLED_ROUTES.routes) {
      l1TokensToDestinationTokens[l1TokenAddress] = {
        ...l1TokensToDestinationTokens[l1TokenAddress],
        [fromChain]: fromTokenAddress,
      };
    }

    const enabledRoutes = applyMapFilter(
      ENABLED_ROUTES.routes,
      // Filter out elements from the request query parameters
      (route: {
        originToken: string;
        originChainId: number;
        destinationChainId: number;
        destinationToken: string;
      }) =>
        (!originToken ||
          originToken.toLowerCase() === route.originToken.toLowerCase()) &&
        (!originChainId || originChainId === String(route.originChainId)) &&
        (!destinationChainId ||
          destinationChainId === String(route.destinationChainId)) &&
        (!destinationToken ||
          destinationToken.toLowerCase() ===
            route.destinationToken.toLowerCase()),
      // Create a mapping of enabled routes to a route with the destination token resolved.
      (route) => ({
        originChainId: route.fromChain,
        originToken: route.fromTokenAddress,
        destinationChainId: route.toChain,
        // Resolve destination chain directly from the
        // l1TokensToDestinationTokens map
        destinationToken:
          l1TokensToDestinationTokens[route.l1TokenAddress][route.toChain],
      })
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
      at: "Routes",
      message: "Response data",
      responseJson: enabledRoutes,
    });
    response.setHeader(
      "Cache-Control",
      "s-maxage=21600, stale-while-revalidate=21600"
    );
    response.status(200).json(enabledRoutes);
  } catch (error) {
    return handleErrorCondition("available-routes", response, logger, error);
  }
};

export default handler;
