import { useCoingeckoPrice } from "./useCoingeckoPrice";
import { BigNumber } from "ethers";
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
    (amount?: BigNumber) => {
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
  return {
    convertTokenToBaseCurrency,
    baseCurrency,
  };
}
