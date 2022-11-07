import { VercelResponse } from "@vercel/node";
import { ethers } from "ethers";
import { isString } from "./_typeguards";
import { CoinGeckoInputRequest } from "./_types";
import { getLogger, InputError, handleErrorCondition } from "./_utils";
import { SUPPORTED_CG_BASE_CURRENCIES } from "./_constants";

import { coingecko, relayFeeCalculator } from "@across-protocol/sdk-v2";

const { Coingecko } = coingecko;
const { SymbolMapping } = relayFeeCalculator;
const { REACT_APP_COINGECKO_PRO_API_KEY, FIXED_TOKEN_PRICES } = process.env;

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

const handler = async (
  { query: { l1Token, baseCurrency } }: CoinGeckoInputRequest,
  response: VercelResponse
) => {
  const logger = getLogger();
  try {
    if (!isString(l1Token))
      throw new InputError("Must provide l1Token as query param");

    // Start the symbol as lower case for CG.
    // This isn't explicitly required, but there's nothing in their docs that guarantee that upper-case symbols will
    // work.
    if (!isString(baseCurrency)) baseCurrency = "eth";
    else baseCurrency = baseCurrency.toLowerCase();

    l1Token = ethers.utils.getAddress(l1Token);

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
      [, price] = await coingeckoClient.getCurrentPriceByContract(
        l1Token,
        baseCurrency
      );
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
