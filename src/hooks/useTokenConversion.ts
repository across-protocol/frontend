import { utils } from "@across-protocol/sdk-v2";
import { useCoingeckoPrice } from "./useCoingeckoPrice";
import { BigNumber } from "ethers";
import { useCallback } from "react";
import { fixedPointAdjustment, getToken, getTokenByAddress } from "utils";
import { ConvertDecimals } from "utils/convertdecimals";
import { TOKEN_SYMBOLS_MAP } from "@across-protocol/constants-v2";

export function useTokenConversion(symbol: string, baseCurrency: string) {
  const token = getToken(symbol);

  // If the token is OP, we need to use the address of the token on Optimism
  const l1Token =
    token.symbol === "OP"
      ? TOKEN_SYMBOLS_MAP["OP"].addresses[10]
      : token.mainnetAddress!;

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
