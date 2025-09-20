import { VercelResponse } from "@vercel/node";
import { ethers } from "ethers";
import { Infer, optional, string, pattern, type, enums } from "superstruct";
import { coingecko, utils } from "@across-protocol/sdk";
import axios from "axios";

import { TypedVercelRequest } from "./_types";
import {
  getLogger,
  handleErrorCondition,
  validAddress,
  getBalancerV2TokenPrice,
  parseQuery,
  positiveInt,
} from "./_utils";
import {
  CG_CONTRACTS_DEFERRED_TO_ID,
  CHAIN_IDs,
  SUPPORTED_CG_BASE_CURRENCIES,
  SUPPORTED_CG_DERIVED_CURRENCIES,
  TOKEN_SYMBOLS_MAP,
  coinGeckoAssetPlatformLookup,
} from "./_constants";
import { compactAxiosError, InvalidParamError } from "./_errors";
import { isEvmAddress } from "./_address";
import { sendResponse } from "./_response_utils";
import { getEnvs } from "./_env";

const { Coingecko } = coingecko;

const {
  REACT_APP_COINGECKO_PRO_API_KEY,
  REDIRECTED_TOKEN_PRICE_LOOKUP_ADDRESSES,
  BALANCER_V2_TOKENS,
} = getEnvs();

const CoingeckoQueryParamsSchema = type({
  l1Token: optional(validAddress()),
  tokenAddress: optional(validAddress()),
  symbol: optional(string()),
  chainId: optional(positiveInt),
  baseCurrency: optional(string()),
  date: optional(pattern(string(), /\d{2}-\d{2}-\d{4}/)),
  fallbackResolver: optional(enums(["lifi"])),
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
    let {
      l1Token,
      tokenAddress,
      chainId: _chainId,
      symbol,
      baseCurrency: _baseCurrency,
      date: dateStr,
      fallbackResolver,
    } = parseQuery(query, CoingeckoQueryParamsSchema);

    let price: number;
    let baseCurrency: string;
    let isDerivedCurrency: boolean;
    let chainId: number;

    // If l1Token OR tokenAddress is provided, we need to resolve the price by address.
    if (l1Token || tokenAddress) {
      const address = l1Token ?? tokenAddress;
      if (!address) {
        throw new InvalidParamError({
          message: `Token Address is undefined. You must define either "l1Token", or "tokenAddress"`,
          param: "l1Token, tokenAddress",
        });
      }
      const resolvedPriceByAddress = await resolvePriceByAddress({
        address,
        chainId: _chainId,
        baseCurrency: _baseCurrency,
        dateStr,
      });
      price = resolvedPriceByAddress.price;
      baseCurrency = resolvedPriceByAddress.baseCurrency;
      isDerivedCurrency = resolvedPriceByAddress.isDerivedCurrency;
      chainId = resolvedPriceByAddress.chainId;

      // If coingecko can't resolve price we use a fallback resolver
      if (
        price === 0 &&
        fallbackResolver &&
        baseCurrency === "usd" &&
        !dateStr
      ) {
        price = await resolveUsdPriceViaFallbackResolver({
          address,
          chainId,
          fallbackResolver,
        });
      }
    }
    // If symbol is provided, we need to resolve the price by symbol.
    else if (symbol) {
      const resolvedPriceBySymbol = await resolvePriceBySymbol({
        symbol,
        baseCurrency: _baseCurrency,
        dateStr,
      });
      price = resolvedPriceBySymbol.price;
      baseCurrency = resolvedPriceBySymbol.baseCurrency;
      isDerivedCurrency = resolvedPriceBySymbol.isDerivedCurrency;
    }
    // If neither l1Token, tokenAddress, nor symbol is provided, we throw an error.
    else {
      throw new InvalidParamError({
        message: "Either 'l1Token', 'tokenAddress', or 'symbol' is required.",
        param: "l1Token, tokenAddress, symbol",
      });
    }

    // If the base currency is a derived currency, we just need to grab
    // the price of the quote currency in USD and perform the conversion.
    let quotePrice = 1.0;
    let quotePrecision = 18;
    if (isDerivedCurrency) {
      const baseToken =
        TOKEN_SYMBOLS_MAP[
          baseCurrency.toUpperCase() as keyof typeof TOKEN_SYMBOLS_MAP
        ];
      const { price: baseTokenPrice } = await resolvePriceBySymbol({
        symbol: baseToken.symbol,
        baseCurrency: "usd",
      });
      quotePrice = baseTokenPrice;
      quotePrecision = baseToken.decimals;
    }
    price = Number((price / quotePrice).toFixed(quotePrecision));

    logger.debug({
      at: "Coingecko",
      message: "Response data",
      responseJson: { price },
    });

    sendResponse({
      response,
      body: { price },
      statusCode: 200,
      cacheSeconds: 150,
      staleWhileRevalidateSeconds: 150,
    });
  } catch (error: unknown) {
    return handleErrorCondition("coingecko", response, logger, error);
  }
};

// Wrapping the price resolution in a separate function to avoid 508 LOOP_DETECTED errors for
// derived currency price resolution.
async function resolvePriceByAddress(params: {
  address: string;
  chainId?: number;
  baseCurrency?: string;
  dateStr?: string;
}) {
  const logger = getLogger();

  const fallbackChainId =
    params.chainId ??
    (isEvmAddress(params.address) ? CHAIN_IDs.MAINNET : CHAIN_IDs.SOLANA);
  const chainId =
    coinGeckoAssetPlatformLookup[params.address] ?? fallbackChainId;

  let address = utils.toAddressType(params.address, chainId).toNative();
  const baseCurrency = (
    params.baseCurrency ?? (utils.chainIsSvm(chainId) ? "sol" : "eth")
  ).toLowerCase();

  const { isDerivedCurrency } = assertValidBaseCurrency(baseCurrency);

  // Resolve the optional address lookup that maps one token's
  // contract address to another.
  const redirectLookupAddresses: Record<string, string> =
    REDIRECTED_TOKEN_PRICE_LOOKUP_ADDRESSES !== undefined
      ? JSON.parse(REDIRECTED_TOKEN_PRICE_LOOKUP_ADDRESSES)
      : {};

  // Perform a 1-deep lookup to see if the provided l1Token is
  // to be "redirected" to another provided token contract address
  if (redirectLookupAddresses[address]) {
    address = redirectLookupAddresses[address];
  }

  const coingeckoClient = Coingecko.get(
    logger,
    REACT_APP_COINGECKO_PRO_API_KEY,
    {
      [CHAIN_IDs.SOLANA]: "solana",
      [CHAIN_IDs.SOLANA_DEVNET]: "solana",
      [CHAIN_IDs.HYPERCORE]: "hyperliquid",
    }
  );

  // We want to compute price and return to caller.
  let price: number;

  const balancerV2PoolTokens: string[] = JSON.parse(
    BALANCER_V2_TOKENS ?? "[]"
  ).map(ethers.utils.getAddress);

  if (balancerV2PoolTokens.includes(address)) {
    if (params.dateStr) {
      throw new InvalidParamError({
        message: "Historical price not supported for BalancerV2 tokens",
        param: "date",
      });
    }
    if (baseCurrency === "usd") {
      price = await getBalancerV2TokenPrice(address);
    } else {
      throw new InvalidParamError({
        message: "Only CG base currency allowed for BalancerV2 tokens is usd",
        param: "baseCurrency",
      });
    }
  }
  // Fetch price dynamically from Coingecko API. If a historical
  // date is provided, fetch historical price. Otherwise, fetch
  // current price.
  else {
    // If derived, we need to convert to USD first.
    const modifiedBaseCurrency = isDerivedCurrency ? "usd" : baseCurrency;
    if (params.dateStr) {
      price = await coingeckoClient.getContractHistoricDayPrice(
        address,
        params.dateStr,
        modifiedBaseCurrency,
        chainId
      );
    } else {
      [, price] = CG_CONTRACTS_DEFERRED_TO_ID.has(address)
        ? await coingeckoClient.getCurrentPriceById(
            address,
            modifiedBaseCurrency,
            chainId
          )
        : await coingeckoClient.getCurrentPriceByContract(
            address,
            modifiedBaseCurrency,
            chainId
          );
    }
  }
  return { price, baseCurrency, isDerivedCurrency, chainId };
}

async function resolvePriceBySymbol(params: {
  symbol: string;
  baseCurrency?: string;
  dateStr?: string;
}) {
  const logger = getLogger();
  const { symbol, baseCurrency = "usd", dateStr } = params;

  if (dateStr) {
    throw new InvalidParamError({
      message:
        "Can't fetch historical price by using 'symbol' query param. Use 'l1Token' or 'tokenAddress' instead.",
      param: "date",
    });
  }

  const { isDerivedCurrency } = assertValidBaseCurrency(baseCurrency);

  const coingeckoClient = Coingecko.get(
    logger,
    REACT_APP_COINGECKO_PRO_API_KEY,
    {
      [CHAIN_IDs.SOLANA]: "solana",
      [CHAIN_IDs.SOLANA_DEVNET]: "solana",
    }
  );

  // If derived, we need to convert to USD first.
  const modifiedBaseCurrency = isDerivedCurrency ? "usd" : baseCurrency;

  const [, price] = await coingeckoClient.getCurrentPriceBySymbol(
    symbol,
    modifiedBaseCurrency
  );
  return { price, baseCurrency, isDerivedCurrency };
}

export async function resolveUsdPriceViaFallbackResolver(params: {
  address: string;
  chainId: number;
  fallbackResolver: string;
}) {
  if (params.fallbackResolver === "lifi") {
    try {
      const { data } = await axios.get<{ priceUSD: string }>(
        `https://li.quest/v1/token`,
        {
          params: {
            chain: params.chainId,
            token: params.address,
          },
        }
      );
      return parseFloat(data.priceUSD);
    } catch (error) {
      getLogger().debug({
        at: "Coingecko/resolveUsdPriceViaFallbackResolver",
        message: "Failed to resolve price via fallback resolver",
        error: compactAxiosError(error as Error),
      });
      return 0;
    }
  }

  throw new InvalidParamError({
    message: "Invalid fallback resolver",
    param: "fallbackResolver",
  });
}

function assertValidBaseCurrency(baseCurrency: string) {
  // Confirm that the base Currency is supported by Coingecko or can be derived by us
  const isDerivedCurrency = SUPPORTED_CG_DERIVED_CURRENCIES.has(baseCurrency);
  if (!SUPPORTED_CG_BASE_CURRENCIES.has(baseCurrency) && !isDerivedCurrency) {
    throw new InvalidParamError({
      message: `Base currency supplied is not supported by this endpoint. Supported currencies: [${Array.from(
        SUPPORTED_CG_BASE_CURRENCIES.union(SUPPORTED_CG_DERIVED_CURRENCIES)
      ).join(", ")}].`,
      param: "baseCurrency",
    });
  }
  return { isDerivedCurrency };
}

export default handler;
