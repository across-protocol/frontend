import { utils } from "@across-protocol/sdk-v2";
import { BigNumber } from "ethers";
import { useCallback } from "react";
import { useQuery } from "react-query";
import { fixedPointAdjustment, getTokenByAddress } from "utils";
import { ConvertDecimals } from "utils/convertdecimals";
import getApiEndpoint from "utils/serverless-api";

export function useCoingeckoPrice(
  l1Token: string,
  baseCurrency: string,
  enabled: boolean = true
) {
  const query = useQuery(
    ["price", l1Token, baseCurrency],
    async () => getApiEndpoint().coingecko(l1Token, baseCurrency),
    {
      enabled,
    }
  );
  const convertTokenToBaseCurrency = useCallback(
    (amount?: BigNumber) => {
      // Resolve the price as an 18 decimal big number which takes
      // the form {PRICE} / 1 token
      const price = query.data?.price;
      // If the price is not defined yet, return undefined
      if (!utils.isDefined(price) || !utils.isDefined(amount)) {
        return undefined;
      }
      // Resolve token decimals
      const { decimals } = getTokenByAddress(l1Token);
      // Convert the amount to the base currency
      const convertedAmount = ConvertDecimals(decimals, 18)(amount);
      // Return the product of the price and the amount
      return price.mul(convertedAmount).div(fixedPointAdjustment);
    },
    [l1Token, query.data]
  );

  return {
    ...query,
    convertTokenToBaseCurrency,
  };
}
