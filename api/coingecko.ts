import { VercelResponse } from "@vercel/node";
import { ethers } from "ethers";
import { object, assert, Infer, optional, string } from "superstruct";
import { TypedVercelRequest } from "./_types";
import {
  getLogger,
  InputError,
  handleErrorCondition,
  validAddress,
  getBalancerV2TokenPrice,
} from "./_utils";
import {
  SUPPORTED_CG_BASE_CURRENCIES,
  CHAIN_IDs,
  TOKEN_SYMBOLS_MAP,
  coinGeckoAssetPlatformLookup,
} from "./_constants";

import { coingecko } from "@across-protocol/sdk";

const { Coingecko } = coingecko;
const {
  REACT_APP_COINGECKO_PRO_API_KEY,
  FIXED_TOKEN_PRICES,
  REDIRECTED_TOKEN_PRICE_LOOKUP_ADDRESSES,
  BALANCER_V2_TOKENS,
} = process.env;

// Helper function to fetch prices from coingecko. Can fetch either or both token and base currency.
// Set hardcodedTokenPriceUsd to 0 to load the token price from coingecko, otherwise load only the base
// currency.
const getCoingeckoPrices = async (
  coingeckoClient: coingecko.Coingecko,
  tokenAddress: string,
  baseCurrency: string,
  hardcodedTokenPrices: {
    [token: string]: number;
  } = {},
  balancerV2PoolTokens: string[] = []
): Promise<number> => {
  const baseCurrencyToken = Object.values(TOKEN_SYMBOLS_MAP).find(
    ({ symbol }) => symbol === baseCurrency.toUpperCase()
  );

  if (!baseCurrencyToken) throw new InputError(`Base currency not supported`);

  // Special case: token and base are the same. Coingecko class returns a single result in this case, so it must
  // be handled separately.
  const baseCurrentTokenAddress =
    baseCurrencyToken.addresses[CHAIN_IDs.MAINNET];
  if (tokenAddress.toLowerCase() === baseCurrentTokenAddress.toLowerCase())
    return 1;

  // If either token or base currency is in hardcoded list then use hardcoded USD price.
  let basePriceUsdPromise: Promise<number> | number | undefined =
    hardcodedTokenPrices[baseCurrentTokenAddress];
  let tokenPriceUsdPromise: Promise<number> | number | undefined =
    hardcodedTokenPrices[tokenAddress];

  if (
    basePriceUsdPromise === undefined &&
    balancerV2PoolTokens.includes(
      ethers.utils.getAddress(baseCurrentTokenAddress)
    )
  ) {
    // Note this assumes mainnet token because all token addresses are assumed to be mainnet in this function.
    basePriceUsdPromise = getBalancerV2TokenPrice(baseCurrentTokenAddress);
  }

  if (
    tokenPriceUsdPromise === undefined &&
    balancerV2PoolTokens.includes(ethers.utils.getAddress(tokenAddress))
  ) {
    // Note this assumes mainnet token because all token addresses are assumed to be mainnet in this function.
    basePriceUsdPromise = getBalancerV2TokenPrice(tokenAddress);
  }

  // Fetch undefined base and token USD prices from coingecko client.
  // Always use usd as the base currency for the purpose of conversion.
  if (basePriceUsdPromise === undefined && tokenPriceUsdPromise === undefined) {
    const groupedPromise = coingeckoClient.getContractPrices(
      [baseCurrentTokenAddress, tokenAddress],
      "usd"
    );
    basePriceUsdPromise = groupedPromise.then((prices) => prices[0].price);
    tokenPriceUsdPromise = groupedPromise.then((prices) => prices[1].price);
  } else if (basePriceUsdPromise === undefined) {
    basePriceUsdPromise = coingeckoClient
      .getContractPrices([baseCurrentTokenAddress, tokenAddress], "usd")
      .then((prices) => prices[0].price);
  } else if (tokenPriceUsdPromise === undefined) {
    basePriceUsdPromise = coingeckoClient
      .getContractPrices([baseCurrentTokenAddress, tokenAddress], "usd")
      .then((prices) => prices[0].price);
  }

  // Extract from a promise.all.
  const [basePriceUsd, tokenPriceUsd] = await Promise.all([
    basePriceUsdPromise,
    tokenPriceUsdPromise,
  ]);

  // Drop any decimals beyond the number of decimals for this token.
  return Number(
    (tokenPriceUsd / basePriceUsd).toFixed(baseCurrencyToken.decimals)
  );
};

const CoingeckoQueryParamsSchema = object({
  l1Token: validAddress(),
  baseCurrency: optional(string()),
});

type CoingeckoQueryParams = Infer<typeof CoingeckoQueryParamsSchema>;

const handler = async (
  { query }: TypedVercelRequest<CoingeckoQueryParams>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "Coingecko",
    message: "Query data",
    query,
  });
  try {
    assert(query, CoingeckoQueryParamsSchema);

    let { l1Token, baseCurrency } = query;

    // Start the symbol as lower case for CG.
    // This isn't explicitly required, but there's nothing in their docs that guarantee that upper-case symbols will
    // work.
    if (!baseCurrency) baseCurrency = "eth";
    else baseCurrency = baseCurrency.toLowerCase();

    l1Token = ethers.utils.getAddress(l1Token);

    // Resolve the optional address lookup that maps one token's
    // contract address to another.
    const redirectLookupAddresses: Record<string, string> =
      REDIRECTED_TOKEN_PRICE_LOOKUP_ADDRESSES !== undefined
        ? JSON.parse(REDIRECTED_TOKEN_PRICE_LOOKUP_ADDRESSES)
        : {};

    // Perform a 1-deep lookup to see if the provided l1Token is
    // to be "redirected" to another provided token contract address
    if (redirectLookupAddresses[l1Token]) {
      l1Token = redirectLookupAddresses[l1Token];
    }

    const coingeckoClient = Coingecko.get(
      logger,
      REACT_APP_COINGECKO_PRO_API_KEY
    );

    // We want to compute price and return to caller.
    let price: number;

    const _fixedTokenPrices: {
      [token: string]: number;
    } = FIXED_TOKEN_PRICES !== undefined ? JSON.parse(FIXED_TOKEN_PRICES) : {};

    // Make sure all keys in `fixedTokenPrices` are in checksum format.
    const fixedTokenPrices = Object.fromEntries(
      Object.entries(_fixedTokenPrices).map(([token, price]) => [
        ethers.utils.getAddress(token),
        price,
      ])
    );

    const balancerV2PoolTokens =
      BALANCER_V2_TOKENS !== undefined
        ? JSON.parse(BALANCER_V2_TOKENS).map(ethers.utils.getAddress)
        : [];

    const platformId = coinGeckoAssetPlatformLookup[l1Token] ?? "ethereum";

    // Caller wants to override price for token, possibly because the token is not supported yet on the Coingecko API,
    // so assume the caller set the USD price of the token. We now need to dynamically load the base currency.
    if (
      fixedTokenPrices[l1Token] !== undefined &&
      !isNaN(fixedTokenPrices[l1Token])
    ) {
      // If base is USD, return hardcoded token price in USD.
      if (baseCurrency === "usd") price = fixedTokenPrices[l1Token];
      else {
        price = await getCoingeckoPrices(
          coingeckoClient,
          l1Token,
          baseCurrency,
          fixedTokenPrices,
          balancerV2PoolTokens
        );
      }
    } else if (
      balancerV2PoolTokens.includes(ethers.utils.getAddress(l1Token))
    ) {
      if (baseCurrency === "usd") {
        price = await getBalancerV2TokenPrice(l1Token);
      } else if (SUPPORTED_CG_BASE_CURRENCIES.has(baseCurrency)) {
        throw new Error(
          "Only CG base currency allowed for BalancerV2 tokens is usd"
        );
      } else {
        price = await getCoingeckoPrices(
          coingeckoClient,
          l1Token,
          baseCurrency,
          fixedTokenPrices,
          balancerV2PoolTokens
        );
      }
    }
    // Fetch price dynamically from Coingecko API
    else if (SUPPORTED_CG_BASE_CURRENCIES.has(baseCurrency)) {
      // This base matches a supported base currency for CG.
      [, price] = await coingeckoClient.getCurrentPriceByContract(
        l1Token,
        baseCurrency,
        platformId
      );
    } else {
      price = await getCoingeckoPrices(
        coingeckoClient,
        l1Token,
        baseCurrency,
        fixedTokenPrices,
        balancerV2PoolTokens
      );
    }

    // Two different explanations for how `stale-while-revalidate` works:

    // https://vercel.com/docs/concepts/edge-network/caching#stale-while-revalidate
    // This tells our CDN the value is fresh for 10 seconds. If a request is repeated within the next 10 seconds,
    // the previously cached value is still fresh. The header x-vercel-cache present in the response will show the
    // value HIT. If the request is repeated between 1 and 20 seconds later, the cached value will be stale but
    // still render. In the background, a revalidation request will be made to populate the cache with a fresh value.
    // x-vercel-cache will have the value STALE until the cache is refreshed.

    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
    // The response is fresh for 150s. After 150s it becomes stale, but the cache is allowed to reuse it
    // for any requests that are made in the following 150s, provided that they revalidate the response in the background.
    // Revalidation will make the cache be fresh again, so it appears to clients that it was always fresh during
    // that period — effectively hiding the latency penalty of revalidation from them.
    // If no request happened during that period, the cache became stale and the next request will revalidate normally.
    logger.debug({
      at: "Coingecko",
      message: "Response data",
      responseJson: { price },
    });
    response.setHeader(
      "Cache-Control",
      "s-maxage=150, stale-while-revalidate=150"
    );
    response.status(200).json({ price });
  } catch (error: unknown) {
    return handleErrorCondition("coingecko", response, logger, error);
  }
};

export default handler;
