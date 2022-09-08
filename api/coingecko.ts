import { VercelResponse } from "@vercel/node";
import { ethers } from "ethers";
import { isString } from "./_typeguards";
import { CoinGeckoInputRequest } from "./_types";
import { getLogger, InputError, handleErrorCondition } from "./_utils";
import { SUPPORTED_CG_BASE_CURRENCIES } from "./_constants";

import { coingecko, relayFeeCalculator } from "@across-protocol/sdk-v2";

const { Coingecko } = coingecko;
const { SymbolMapping } = relayFeeCalculator;
const { REACT_APP_COINGECKO_PRO_API_KEY } = process.env;

const handler = async (
  { query: { l1Token, baseCurrency } }: CoinGeckoInputRequest,
  response: VercelResponse
) => {
  const logger = getLogger();
  try {
    if (!isString(l1Token))
      throw new InputError("Must provide l1Token as query param");

    // Start with the symbol being strictly upper-case, as that's how symbols are typically represented.
    if (!isString(baseCurrency)) baseCurrency = "ETH";
    else baseCurrency = baseCurrency.toUpperCase();

    l1Token = ethers.utils.getAddress(l1Token);

    // Coingecko doesn't seem to be case sensitive, but there doesn't seem to be anything in their documentation
    // guaranteeing this, so to be safe, we lower case before sending to CG.
    const cgBaseCurrency = baseCurrency.toLowerCase();

    const coingeckoClient = Coingecko.get(
      logger,
      REACT_APP_COINGECKO_PRO_API_KEY
    );

    let price: number;

    if (SUPPORTED_CG_BASE_CURRENCIES.has(cgBaseCurrency)) {
      // This base matches a supported base currency for CG.
      [, price] = await coingeckoClient.getCurrentPriceByContract(
        l1Token,
        cgBaseCurrency
      );
    } else {
      // No match, so we try to look up the base currency directly.
      const baseCurrencyToken = SymbolMapping[baseCurrency];

      if (!baseCurrencyToken)
        throw new InputError(
          "baseCurrency not supported in Coingecko and not found in address mapping"
        );

      // Special case: token and base are the same. Coingecko class returns a single result in this case, so it must
      // be handled separately.
      if (l1Token.toLowerCase() === baseCurrencyToken.address.toLowerCase())
        price = 1;
      else {
        // Always use usd as the base currency for the purpose of conversion.
        const [price1, price2] = await coingeckoClient.getContractPrices(
          [l1Token, baseCurrencyToken.address],
          "usd"
        );

        console.log(price1, price2);

        // The ordering of the returned values are not guaranteed, so determine the ordering of the two values by
        // comparing to the l1Token value.
        const [tokenPriceUsd, basePriceUsd] =
          price1.address.toLowerCase() === l1Token.toLowerCase()
            ? [price1.price, price2.price]
            : [price2.price, price1.price];

        // Drop any decimals beyond the number of decimals for this token.
        price = Number(
          (tokenPriceUsd / basePriceUsd).toFixed(baseCurrencyToken.decimals)
        );
      }
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
