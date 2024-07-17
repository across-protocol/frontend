import { VercelResponse } from "@vercel/node";
import { ethers } from "ethers";
import { object, assert, Infer, optional, string, pattern } from "superstruct";
import { TypedVercelRequest } from "./_types";
import {
  getLogger,
  InputError,
  handleErrorCondition,
  validAddress,
  getBalancerV2TokenPrice,
  getCachedTokenPrice,
} from "./_utils";
import {
  CHAIN_IDs,
  SUPPORTED_CG_BASE_CURRENCIES,
  SUPPORTED_CG_DERIVED_CURRENCIES,
  TOKEN_SYMBOLS_MAP,
  coinGeckoAssetPlatformLookup,
} from "./_constants";

import { coingecko } from "@across-protocol/sdk";

const { Coingecko } = coingecko;
const {
  REACT_APP_COINGECKO_PRO_API_KEY,
  REDIRECTED_TOKEN_PRICE_LOOKUP_ADDRESSES,
  BALANCER_V2_TOKENS,
} = process.env;

const CoingeckoQueryParamsSchema = object({
  l1Token: validAddress(),
  baseCurrency: optional(string()),
  date: optional(pattern(string(), /\d{2}-\d{2}-\d{4}/)),
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

    let { l1Token, baseCurrency, date: dateStr } = query;

    // Format the params for consistency
    baseCurrency = (baseCurrency ?? "eth").toLowerCase();
    l1Token = ethers.utils.getAddress(l1Token);

    // Confirm that the base Currency is supported by Coingecko
    const isDerivedCurrency = SUPPORTED_CG_DERIVED_CURRENCIES.has(baseCurrency);
    if (!SUPPORTED_CG_BASE_CURRENCIES.has(baseCurrency) && !isDerivedCurrency) {
      throw new InputError(
        `Base currency supplied is not supported by this endpoint. Supported currencies: [${Array.from(
          SUPPORTED_CG_BASE_CURRENCIES
        ).join(", ")}].`
      );
    }

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

    const balancerV2PoolTokens: string[] = JSON.parse(
      BALANCER_V2_TOKENS ?? "[]"
    ).map(ethers.utils.getAddress);

    const platformId = coinGeckoAssetPlatformLookup[l1Token] ?? "ethereum";

    if (balancerV2PoolTokens.includes(ethers.utils.getAddress(l1Token))) {
      if (dateStr) {
        throw new InputError(
          "Historical price not supported for BalancerV2 tokens"
        );
      }
      if (baseCurrency === "usd") {
        price = await getBalancerV2TokenPrice(l1Token);
      } else {
        throw new InputError(
          "Only CG base currency allowed for BalancerV2 tokens is usd"
        );
      }
    }
    // Fetch price dynamically from Coingecko API. If a historical
    // date is provided, fetch historical price. Otherwise, fetch
    // current price.
    else {
      // // If derived, we need to convert to USD first.
      const modifiedBaseCurrency = isDerivedCurrency ? "usd" : baseCurrency;
      if (dateStr) {
        price = await coingeckoClient.getContractHistoricDayPrice(
          l1Token,
          dateStr,
          modifiedBaseCurrency
        );
      } else {
        [, price] = await coingeckoClient.getCurrentPriceByContract(
          l1Token,
          modifiedBaseCurrency,
          platformId
        );
      }
    }

    // If the base currency is a derived currency, we just need to grab
    // the price of the quote currency in USD and perform the conversion.
    let quotePrice = 1.0;
    let quotePrecision = 18;
    if (isDerivedCurrency) {
      const token =
        TOKEN_SYMBOLS_MAP[
          baseCurrency.toUpperCase() as keyof typeof TOKEN_SYMBOLS_MAP
        ];
      quotePrice = await getCachedTokenPrice(
        token.addresses[CHAIN_IDs.MAINNET],
        "usd"
      );
      quotePrecision = token.decimals;
    }
    price = Number((price / quotePrice).toFixed(quotePrecision));

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
