import { useCoingeckoPrice } from "./useCoingeckoPrice";
import { BigNumber, BigNumberish, ethers } from "ethers";
import { useCallback } from "react";
import {
  fixedPointAdjustment,
  getToken,
  getTokenByAddress,
  TOKEN_SYMBOLS_MAP,
  isDefined,
} from "utils";
import { ConvertDecimals } from "utils/convertdecimals";

export function useTokenConversion(
  symbol: string,
  baseCurrency: string,
  historicalDateISO?: string
) {
  const token = getToken(symbol);

  // If the token is OP, we need to use the address of the token on Optimism
  const l1Token =
    token.symbol === "OP"
      ? TOKEN_SYMBOLS_MAP["OP"].addresses[10]
      : token.mainnetAddress!;

  const query = useCoingeckoPrice(
    l1Token,
    baseCurrency,
    historicalDateISO,
    isDefined(l1Token)
  );

  const convertTokenToBaseCurrency = useCallback(
    (amount?: BigNumberish) => {
      const price = query.data?.price;
      if (!isDefined(price) || !isDefined(amount)) {
        return undefined;
      }
      const decimals = token?.decimals ?? getTokenByAddress(l1Token)?.decimals;
      const convertedAmount = ConvertDecimals(decimals, 18)(amount);
      return price.mul(convertedAmount).div(fixedPointAdjustment);
    },
    [l1Token, token, query.data?.price]
  );

  const convertBaseCurrencyToToken = useCallback(
    (amount?: BigNumberish) => {
      const price = query.data?.price;
      if (!isDefined(price) || !isDefined(amount)) {
        return undefined;
      }
      const decimals = token?.decimals ?? getTokenByAddress(l1Token)?.decimals;
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
    [query.data?.price, token, l1Token, convertTokenToBaseCurrency]
  );

  return {
    convertTokenToBaseCurrency,
    convertBaseCurrencyToToken,
    baseCurrency,
  };
}
