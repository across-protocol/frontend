const { getLogger, InputError } = require("./_utils");
const enabledRoutesAsJson = require("../src/data/routes_1_0xc186fA914353c44b2E33eBE05f21846F1048bEda.json");

const handler = async (request, response) => {
  const logger = getLogger();
  try {
    let { originChainId, destinationChainId, originToken, destinationToken } =
      request.query;

    let enabledRoutes = enabledRoutesAsJson.routes.map((route) => ({
      originChainId: String(route.fromChain),
      originToken: String(route.fromTokenAddress),
      destinationChainId: String(route.toChain),
      l1TokenAddress: String(route.l1TokenAddress),
    }));

    // Generate a mapping that contains similar tokens on each chain
    // Note:  The key in this dictionary represents an l1Token address, and
    //        the corresponding value is a nested hashmap containing a key
    //        value pair of {chainId: l2TokenEquivalent}
    let l1TokensToDestinationTokens = {};
    for (const {
      l1TokenAddress,
      fromChain,
      fromTokenAddress,
    } of enabledRoutesAsJson.routes) {
      l1TokensToDestinationTokens[l1TokenAddress] = {
        ...l1TokensToDestinationTokens[l1TokenAddress],
        [fromChain]: fromTokenAddress,
      };
    }

    // Create a mapping of enabled routes to
    // a route with the destination token resolved.
    enabledRoutes = enabledRoutes.map((route) => ({
      originChainId: route.originChainId,
      originToken: route.originToken,
      destinationChainId: route.destinationChainId,
      // Resolve destination chain directly from the
      // l1TokensToDestinationTokens map
      destinationToken:
        l1TokensToDestinationTokens[route.l1TokenAddress][
          route.destinationChainId
        ],
    }));

    // Filter out elements from the request query parameters
    if (
      !!originToken ||
      !!originChainId ||
      !!destinationChainId ||
      !!destinationToken
    ) {
      enabledRoutes = enabledRoutes.filter(
        (route) =>
          (!originToken ||
            originToken.toLowerCase() === route.originToken.toLowerCase()) &&
          (!originChainId || originChainId === route.originChainId) &&
          (!destinationChainId ||
            destinationChainId === route.destinationChainId) &&
          (!destinationToken ||
            destinationToken.toLowerCase() ===
              route.destinationToken.toLowerCase())
      );
    }

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
    response.setHeader(
      "Cache-Control",
      "s-maxage=21600, stale-while-revalidate=21600"
    );
    response.status(200).json(enabledRoutes);
  } catch (error) {
    let status;
    if (error instanceof InputError) {
      logger.warn({
        at: "available-routes",
        message: "400 input error",
        error,
      });
      status = 400;
    } else {
      logger.error({
        at: "available-routes",
        message: "500 server error",
        error,
      });
      status = 500;
    }
    response.status(status).send(error.message);
  }
};

module.exports = handler;
