const ethers = require("ethers");

const { logger, InputError, isString, getTokenPrice } = require("./_utils");

const handler = async (request, response) => {
  try {
    let { l1Token } = request.query;
    if (!isString(l1Token))
      throw new InputError("Must provide l1Token as query param");

    l1Token = ethers.utils.getAddress(l1Token);

    const price = await getTokenPrice(l1Token, 1);

    // Two different explanations for how `stale-while-revalidate` works:

    // https://vercel.com/docs/concepts/edge-network/caching#stale-while-revalidate
    // This tells our CDN the value is fresh for 10 seconds. If a request is repeated within the next 10 seconds,
    // the previously cached value is still fresh. The header x-vercel-cache present in the response will show the
    // value HIT. If the request is repeated between 1 and 20 seconds later, the cached value will be stale but
    // still render. In the background, a revalidation request will be made to populate the cache with a fresh value.
    // x-vercel-cache will have the value STALE until the cache is refreshed.

    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
    // The response is fresh for 10s. After 10s it becomes stale, but the cache is allowed to reuse it
    // for any requests that are made in the following 20s, provided that they revalidate the response in the background.
    // Revalidation will make the cache be fresh again, so it appears to clients that it was always fresh during
    // that period — effectively hiding the latency penalty of revalidation from them.
    // If no request happened during that period, the cache became stale and the next request will revalidate normally.
    response.setHeader(
      "Cache-Control",
      "s-maxage=10, stale-while-revalidate=20"
    );
    response.status(200).json({ price });
  } catch (error) {
    let status;
    if (error instanceof InputError) {
      logger.warn({ at: "coingecko", message: "400 input error", error });
      status = 400;
    } else {
      logger.error({ at: "coingecko", message: "500 server error", error });
      status = 500;
    }
    response.status(status).send(error.message);
  }
};

module.exports = handler;
