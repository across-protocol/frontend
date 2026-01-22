import { useCoingeckoPrice } from "./useCoingeckoPrice";
import { BigNumber, BigNumberish, ethers } from "ethers";
import { useCallback } from "react";
import {
  fixedPointAdjustment,
  TOKEN_SYMBOLS_MAP,
  isDefined,
  getConfig,
  hubPoolChainId,
} from "utils";
import { ConvertDecimals } from "utils/convertdecimals";
import { useToken } from "./useToken";

const config = getConfig();

export function useTokenConversion(
  symbol: string,
  baseCurrency: string,
  historicalDateISO?: string
) {
  // Use the useToken hook to resolve token info
  const token = useToken(symbol);

  // Check if we can use token.priceUsd directly (only for USD base currency and current price)
  const canUseTokenPrice =
    token?.priceUsd &&
    token.priceUsd !== null &&
    baseCurrency.toLowerCase() === "usd" &&
    !historicalDateISO;

  // Only resolve l1TokenAddress and use CoinGecko if we can't use token.priceUsd
  const l1Token = canUseTokenPrice
    ? undefined
    : token?.symbol === "OP"
      ? TOKEN_SYMBOLS_MAP["OP"].addresses[10]
      : token?.mainnetAddress;

  const query = useCoingeckoPrice(
    l1Token || "",
    baseCurrency,
    historicalDateISO,
    !canUseTokenPrice && isDefined(l1Token)
  );

  // Convert token.priceUsd string to BigNumber (18 decimals) if available
  const tokenPriceUsd =
    canUseTokenPrice && token.priceUsd
      ? ethers.utils.parseUnits(token.priceUsd, 18)
      : undefined;

  const convertTokenToBaseCurrency = useCallback(
    (amount?: BigNumberish) => {
      // Use token.priceUsd if available, otherwise fall back to CoinGecko
      const price = tokenPriceUsd || query.data?.price;
      const decimals =
        token?.decimals ??
        (l1Token
          ? config.getTokenInfoByAddressSafe(hubPoolChainId, l1Token)?.decimals
          : undefined);

      if (!isDefined(price) || !isDefined(amount) || !isDefined(decimals)) {
        return undefined;
      }

      const convertedAmount = ConvertDecimals(decimals, 18)(amount);
      return price.mul(convertedAmount).div(fixedPointAdjustment);
    },
    [l1Token, token, tokenPriceUsd, query.data?.price]
  );

  const convertBaseCurrencyToToken = useCallback(
    (amount?: BigNumberish) => {
      // Use token.priceUsd if available, otherwise fall back to CoinGecko
      const price = tokenPriceUsd || query.data?.price;
      const decimals =
        token?.decimals ??
        (l1Token
          ? config.getTokenInfoByAddressSafe(hubPoolChainId, l1Token)?.decimals
          : undefined);

      if (!isDefined(price) || !isDefined(amount) || !isDefined(decimals)) {
        return undefined;
      }

      const exchangeRate = convertTokenToBaseCurrency(
        ethers.utils.parseUnits("1", decimals)
      );

      if (!isDefined(exchangeRate)) {
        return undefined;
      }

      return BigNumber.from(amount)
        .mul(ethers.utils.parseUnits("1", decimals))
        .div(exchangeRate);
    },
    [
      tokenPriceUsd,
      query.data?.price,
      token,
      l1Token,
      convertTokenToBaseCurrency,
    ]
  );

  return {
    convertTokenToBaseCurrency,
    convertBaseCurrencyToToken,
    baseCurrency,
  };
}
