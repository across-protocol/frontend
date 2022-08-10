const ethers = require("ethers");

const { InputError, isString, getTokenPrice } = require("./_utils");

const handler = async (request, response) => {
  console.log(`INFO(pools): Handling request to /coingecko`, request);

  try {
    let { l1Token } = request.query;
    if (!isString(l1Token))
      throw new InputError("Must provide l1Token as query param");

    l1Token = ethers.utils.getAddress(l1Token);

    const price = await getTokenPrice(l1Token, 1);

    // This tells our CDN the value is fresh for one second. If a request is repeated within the next second,
    // the previously cached value is still fresh. The header x-vercel-cache present in the response will show the
    // value HIT. If the request is repeated between 1 and 60 seconds later, the cached value will be stale but
    // still render. In the background, a revalidation request will be made to populate the cache with a fresh value.
    // x-vercel-cache will have the value STALE until the cache is refreshed.
    response.setHeader(
      "Cache-Control",
      "s-maxage=1, stale-while-revalidate=59"
    );
    response.status(200).json({ price });
  } catch (error) {
    console.log(`ERROR(coingecko): Error found: ${error}`);

    let status;
    if (error instanceof InputError) {
      status = 400;
    } else {
      status = 500;
    }
    response.status(status).send(error.message);
  }
};

module.exports = handler;
