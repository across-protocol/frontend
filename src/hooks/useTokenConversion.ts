import { utils } from "@across-protocol/sdk-v2";
import { useCoingeckoPrice } from "./useCoingeckoPrice";
import { BigNumber } from "ethers";
import { useCallback } from "react";
import { fixedPointAdjustment, getToken, getTokenByAddress } from "utils";
import { ConvertDecimals } from "utils/convertdecimals";

export function useTokenConversion(symbol: string, baseCurrency: string) {
  const token = getToken(symbol);
  const l1Token = token.mainnetAddress!;
  const query = useCoingeckoPrice(
    l1Token,
    baseCurrency,
    utils.isDefined(l1Token)
  );
  const convertTokenToBaseCurrency = useCallback(
    (amount?: BigNumber) => {
      const price = query.data?.price;
      if (!utils.isDefined(price) || !utils.isDefined(amount)) {
        return undefined;
      }
      const { decimals } = getTokenByAddress(l1Token);
      const convertedAmount = ConvertDecimals(decimals, 18)(amount);
      return price.mul(convertedAmount).div(fixedPointAdjustment);
    },
    [l1Token, query.data?.price]
  );
  return {
    convertTokenToBaseCurrency,
    baseCurrency,
  };
}
