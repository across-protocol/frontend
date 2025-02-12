import { VercelResponse } from "@vercel/node";
import { assert, Infer, optional, string, type } from "superstruct";
import {
  getLogger,
  applyMapFilter,
  validAddress,
  positiveIntStr,
  ENABLED_ROUTES,
  handleErrorCondition,
  DISABLED_CHAINS_FOR_AVAILABLE_ROUTES,
  DISABLED_TOKENS_FOR_AVAILABLE_ROUTES,
  OPT_IN_CHAINS,
} from "./_utils";
import { TypedVercelRequest } from "./_types";
import { Role } from "./_auth";
import { parseRole } from "./_auth";

const AvailableRoutesQueryParamsSchema = type({
  originToken: optional(validAddress()),
  destinationToken: optional(validAddress()),
  destinationChainId: optional(positiveIntStr()),
  originChainId: optional(positiveIntStr()),
  originTokenSymbol: optional(string()),
  destinationTokenSymbol: optional(string()),
});

type AvailableRoutesQueryParams = Infer<
  typeof AvailableRoutesQueryParamsSchema
>;

const handler = async (
  request: TypedVercelRequest<AvailableRoutesQueryParams>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "Routes",
    message: "Query data",
    query: request.query,
  });
  try {
    const role = parseRole(request);

    const { query } = request;
    assert(query, AvailableRoutesQueryParamsSchema);

    const {
      originToken,
      destinationToken,
      originChainId,
      destinationChainId,
      originTokenSymbol,
      destinationTokenSymbol,
    } = query;

    const disabledChains = [
      ...DISABLED_CHAINS_FOR_AVAILABLE_ROUTES,
      ...(role === Role.OPT_IN_CHAINS ? [] : OPT_IN_CHAINS),
    ];

    const enabledRoutes = applyMapFilter(
      ENABLED_ROUTES.routes,
      // Filter out elements from the request query parameters
      (route: {
        originToken: string;
        originChainId: number;
        destinationChainId: number;
        destinationToken: string;
        fromTokenSymbol: string;
        toTokenSymbol: string;
        isNative: boolean;
      }) =>
        ![route.originChainId, route.destinationChainId].some((chainId) =>
          disabledChains.includes(String(chainId))
        ) &&
        !DISABLED_TOKENS_FOR_AVAILABLE_ROUTES.some(
          (s) => s.toUpperCase() === route.fromTokenSymbol.toUpperCase()
        ) &&
        (!originToken ||
          originToken.toLowerCase() === route.originToken.toLowerCase()) &&
        (!originChainId || originChainId === String(route.originChainId)) &&
        (!destinationChainId ||
          destinationChainId === String(route.destinationChainId)) &&
        (!destinationToken ||
          destinationToken.toLowerCase() ===
            route.destinationToken.toLowerCase()) &&
        (!originTokenSymbol ||
          originTokenSymbol.toUpperCase() ===
            route.fromTokenSymbol.toUpperCase()) &&
        (!destinationTokenSymbol ||
          destinationTokenSymbol.toUpperCase() ===
            route.toTokenSymbol.toUpperCase()) &&
        (route as { externalProjectId?: string }).externalProjectId ===
          undefined,
      // Create a mapping of enabled routes to a route with the destination token resolved.
      (route) => ({
        originChainId: route.fromChain,
        originToken: route.fromTokenAddress,
        destinationChainId: route.toChain,
        fromTokenSymbol: route.fromTokenSymbol,
        toTokenSymbol: route.toTokenSymbol,
        destinationToken: route.toTokenAddress,
        isNative: route.isNative,
      })
    ).map((route) => ({
      originChainId: route.originChainId,
      originToken: route.originToken,
      destinationChainId: route.destinationChainId,
      destinationToken: route.destinationToken,
      originTokenSymbol: route.fromTokenSymbol,
      destinationTokenSymbol: route.toTokenSymbol,
      isNative: route.isNative,
    }));

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
  } catch (error: unknown) {
    return handleErrorCondition("available-routes", response, logger, error);
  }
};

export default handler;
