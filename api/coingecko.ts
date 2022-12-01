import { VercelResponse } from "@vercel/node";
import { ethers } from "ethers";
import { DateTime, Duration } from "luxon";
import { isString } from "./_typeguards";
import { CoinGeckoInputRequest } from "./_types";
import { getLogger, InputError, handleErrorCondition } from "./_utils";
import { SUPPORTED_CG_BASE_CURRENCIES } from "./_constants";

import { coingecko, relayFeeCalculator } from "@across-protocol/sdk-v2";

const { Coingecko } = coingecko;
const { SymbolMapping } = relayFeeCalculator;
const {
  REACT_APP_COINGECKO_PRO_API_KEY,
  FIXED_TOKEN_PRICES,
  REDIRECTED_TOKEN_PRICE_LOOKUP_ADDRESSES,
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
  } = {}
): Promise<number> => {
  const baseCurrencyToken = SymbolMapping[baseCurrency.toUpperCase()];

  if (!baseCurrencyToken)
    throw new InputError(`Base currency ${baseCurrency} not supported`);

  // Special case: token and base are the same. Coingecko class returns a single result in this case, so it must
  // be handled separately.
  if (tokenAddress.toLowerCase() === baseCurrencyToken.address.toLowerCase())
    return 1;

  // If either token or base currency is in hardcoded list then use hardcoded USD price.
  let basePriceUsd = hardcodedTokenPrices[baseCurrencyToken.address];
  let tokenPriceUsd = hardcodedTokenPrices[tokenAddress];

  // Fetch undefined base and token USD prices from coingecko client.
  // Always use usd as the base currency for the purpose of conversion.
  const tokenAddressesToFetchPricesFor = [];
  if (basePriceUsd === undefined)
    tokenAddressesToFetchPricesFor.push(baseCurrencyToken.address);
  if (tokenPriceUsd === undefined)
    tokenAddressesToFetchPricesFor.push(tokenAddress);

  // Fetch prices and sanitize returned value
  const prices = await coingeckoClient.getContractPrices(
    tokenAddressesToFetchPricesFor,
    "usd"
  );
  if (prices.length === 0 || prices.length > 2)
    throw new Error("unexpected prices list returned by coingeckoClient");

  // The ordering of the returned values are not guaranteed, so determine the ordering of the two values by
  // comparing to the l1Token value.
  if (prices.length === 2)
    [tokenPriceUsd, basePriceUsd] =
      prices[0].address.toLowerCase() === tokenAddress.toLowerCase()
        ? [prices[0].price, prices[1].price]
        : [prices[1].price, prices[0].price];
  else {
    // Only one price was fetched, and it was the one (i.e. base or token) that wasn't hardcoded.
    if (basePriceUsd === undefined) basePriceUsd = prices[0].price;
    else tokenPriceUsd = prices[0].price;
  }

  // Drop any decimals beyond the number of decimals for this token.
  return Number(
    (tokenPriceUsd / basePriceUsd).toFixed(baseCurrencyToken.decimals)
  );
};

const getHistoricPrice = async (
  coingeckoClient: coingecko.Coingecko,
  tokenAddress: string,
  baseCurrency: string,
  timestamp: string
) => {
  const timestampDateTime = DateTime.fromSeconds(parseInt(timestamp));
  const diffToNow = timestampDateTime.diffNow();

  if (diffToNow.as("seconds") > 0 || !diffToNow.isValid) {
    throw new InputError("Timestamp must be in the past and valid");
  }

  // We need to add some range offset to the `from` and `to` query params,
  // due to the automatic data granularity of the historical market data from Coingecko:
  // - 1 day from current time = 5 minute interval data
  // - 1 - 90 days from current time = hourly data
  // - above 90 days from current time = daily data (00:00 UTC)
  const diffToNowInDays = Math.abs(diffToNow.as("days"));
  const rangeOffset =
    diffToNowInDays <= 1
      ? Duration.fromDurationLike({ minutes: 5 })
      : diffToNowInDays <= 90
      ? Duration.fromDurationLike({ hours: 1 })
      : Duration.fromDurationLike({ days: 1 });
  const from = timestampDateTime.minus(rangeOffset).toMillis();
  const to = timestampDateTime.plus(rangeOffset).toMillis();

  const priceTuples: [timestamp: number, price: number][] =
    await coingeckoClient.getHistoricContractPrices(
      tokenAddress,
      from,
      to,
      baseCurrency
    );
  if (!priceTuples.length) {
    throw new Error("no historic prices returned by coingeckoClient");
  }

  // Because Coingecko can not return the historic price for an exact timestamp,
  // we return the closest price at the closest timestamp.
  const timestampDeltas = priceTuples.map(([timestamp]) =>
    Math.abs(timestampDateTime.toMillis() - timestamp)
  );
  const minDelta = Math.min(...timestampDeltas);
  const minIndex = timestampDeltas.findIndex((delta) => delta === minDelta);
  const closestTuple = priceTuples[minIndex];
  return closestTuple[1];
};

const handler = async (
  { query: { l1Token, baseCurrency, timestamp } }: CoinGeckoInputRequest,
  response: VercelResponse
) => {
  const logger = getLogger();
  try {
    if (isString(timestamp) && isNaN(parseInt(timestamp))) {
      throw new InputError("Invalid timestamp");
    }

    if (!isString(l1Token))
      throw new InputError("Must provide l1Token as query param");

    // Start the symbol as lower case for CG.
    // This isn't explicitly required, but there's nothing in their docs that guarantee that upper-case symbols will
    // work.
    if (!isString(baseCurrency)) baseCurrency = "eth";
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
          fixedTokenPrices
        );
      }
    }
    // Fetch price dynamically from Coingecko API
    else if (SUPPORTED_CG_BASE_CURRENCIES.has(baseCurrency)) {
      // This base matches a supported base currency for CG.

      if (!timestamp) {
        [, price] = await coingeckoClient.getCurrentPriceByContract(
          l1Token,
          baseCurrency
        );
      } else {
        price = await getHistoricPrice(
          coingeckoClient,
          l1Token,
          baseCurrency,
          timestamp
        );
      }
    } else {
      price = await getCoingeckoPrices(
        coingeckoClient,
        l1Token,
        baseCurrency,
        fixedTokenPrices
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
