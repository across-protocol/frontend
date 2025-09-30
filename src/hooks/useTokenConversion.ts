import { useCoingeckoPrice } from "./useCoingeckoPrice";
import { BigNumber, BigNumberish, ethers } from "ethers";
import { useCallback } from "react";
import {
  fixedPointAdjustment,
  getToken,
  TOKEN_SYMBOLS_MAP,
  isDefined,
  getConfig,
  hubPoolChainId,
} from "utils";
import { ConvertDecimals } from "utils/convertdecimals";
import useAvailableCrosschainRoutes from "./useAvailableCrosschainRoutes";

const config = getConfig();

export function useTokenConversion(
  symbol: string,
  baseCurrency: string,
  historicalDateISO?: string
) {
  const availableCrosschainRoutes = useAvailableCrosschainRoutes();

  // Try to get token from constants first, fallback to swap API data
  let token;
  try {
    token = getToken(symbol);
  } catch (error) {
    // If token not found in constants, try to find it in swap API data
    const swapTokens = availableCrosschainRoutes.data;
    if (swapTokens) {
      // Search across all chains for a token with matching symbol
      for (const chainId of Object.keys(swapTokens)) {
        const tokensOnChain = swapTokens[Number(chainId)];
        const foundToken = tokensOnChain.find(
          (t) => t.symbol.toUpperCase() === symbol.toUpperCase()
        );
        if (foundToken) {
          // Convert LifiToken to TokenInfo format
          token = {
            symbol: foundToken.symbol,
            name: foundToken.name,
            decimals: foundToken.decimals,
            addresses: { [foundToken.chainId]: foundToken.address },
            mainnetAddress: foundToken.address, // Use the found address as mainnet address
            logoURI: foundToken.logoURI,
          };
          break;
        }
      }
    }

    // If still not found, re-throw the original error
    if (!token) {
      throw error;
    }
  }

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
      const decimals =
        token?.decimals ??
        config.getTokenInfoByAddressSafe(hubPoolChainId, l1Token)?.decimals;

      if (!isDefined(price) || !isDefined(amount) || !isDefined(decimals)) {
        return undefined;
      }

      const convertedAmount = ConvertDecimals(decimals, 18)(amount);
      return price.mul(convertedAmount).div(fixedPointAdjustment);
    },
    [l1Token, token, query.data?.price]
  );

  const convertBaseCurrencyToToken = useCallback(
    (amount?: BigNumberish) => {
      const price = query.data?.price;
      const decimals =
        token?.decimals ??
        config.getTokenInfoByAddressSafe(hubPoolChainId, l1Token)?.decimals;

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
    [query.data?.price, token, l1Token, convertTokenToBaseCurrency]
  );

  return {
    convertTokenToBaseCurrency,
    convertBaseCurrencyToToken,
    baseCurrency,
  };
}
