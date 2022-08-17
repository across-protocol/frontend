const { HubPool__factory } = require("@across-protocol/contracts-v2");

const { getLogger, InputError, getProvider } = require("./_utils");

const handler = async (request, response) => {
  const logger = getLogger();
  try {
    let { originChainId, destinationChainId, originToken, destinationToken } =
      request.query;
    originChainId = (originChainId ?? "").toLowerCase();
    destinationChainId = (destinationChainId ?? "").toLowerCase();
    originToken = (originToken ?? "").toLowerCase();
    destinationToken = (destinationToken ?? "").toLowerCase();

    const hubPool = HubPool__factory.connect(
      "0xc186fA914353c44b2E33eBE05f21846F1048bEda",
      getProvider("1")
    );

    // Find events from the SetEnableDepositRoute in block-sorted order
    const result = (
      await hubPool.queryFilter(hubPool.filters.SetEnableDepositRoute())
    ).sort((a, b) => {
      return a.blockNumber - b.blockNumber;
    });
    // Replay all events in block order to determine the token/chain pairs
    // that are currently enabled for deposits.
    let enabledRoutes = Object.values(
      // Leverage lookup times of a hashmap to quickly add routes to this
      // search / update them if their enabled status changes
      result.reduce((accumulator, event) => {
        const {
          originChainId,
          originToken,
          destinationChainId,
          depositsEnabled: enabled,
        } = event.args;
        accumulator[`${originChainId}:${originToken}:${destinationChainId}`] = {
          enabled,
          originToken,
          destinationChainId: destinationChainId.toString(),
          originChainId: originChainId.toString(),
        };
        return accumulator;
      }, {})
    )
      // Filter the set to only include enabled routes
      .filter((event) => event.enabled);

    // Generate a mapping that contains similar tokens on each chain
    // Note:  The key in this dictionary represents an l1Token address, and
    //        the corresponding value is a nested hashmap containing a key
    //        value pair of {chainId: l2TokenEquivalent}
    let l1TokensToDestinationTokens = {};
    const poolRebalanceRouteEvents = await hubPool.queryFilter(
      hubPool.filters.SetPoolRebalanceRoute()
    );
    for (const event of poolRebalanceRouteEvents) {
      const { l1Token, destinationChainId, destinationToken } = event.args;
      const obj = l1TokensToDestinationTokens[l1Token] ?? {};
      obj[destinationChainId] = destinationToken;
      l1TokensToDestinationTokens[l1Token] = obj;
    }

    // Convert this map to an array for convenience in the following logic
    l1TokensToDestinationTokens = Object.values(l1TokensToDestinationTokens);

    // Loop through each enabled route with the intention of setting the
    // destination token address
    enabledRoutes.forEach((route) => {
      // Iterate over each token mapping
      for (const tokenSet of l1TokensToDestinationTokens) {
        // Check to see if the origin ChainId for this event is
        // a set-member of the tokenSet
        if (tokenSet[route.originChainId] === route.originToken) {
          // Further check if the destinationChainId has a mapping
          // to a valid destination token
          const destinationToken = tokenSet[route.destinationChainId];
          if (destinationToken !== undefined) {
            // If a valid destinationToken is found, let's update
            // the route and leave this loop
            route["destinationToken"] = destinationToken;
            break;
          }
        }
      }
    });

    // Filter out elements from the request query parameters
    if (
      !!originToken ||
      !!originChainId ||
      !!destinationChainId ||
      !!destinationToken
    ) {
      enabledRoutes = enabledRoutes.filter(
        (route) =>
          (!originToken || originToken === route.originToken.toLowerCase()) &&
          (!originChainId ||
            originChainId === route.originChainId.toLowerCase()) &&
          (!destinationChainId ||
            destinationChainId === route.destinationChainId.toLowerCase()) &&
          (!destinationToken ||
            destinationToken === route.destinationToken.toLowerCase())
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
