import { useMemo } from "react";
import {
  getToken,
  TOKEN_SYMBOLS_MAP,
  TokenInfo,
  applyChainSpecificTokenDisplay,
} from "utils";
import { orderedTokenLogos } from "../constants/tokens";
import { useSwapTokens } from "./useSwapTokens";
import unknownLogo from "assets/icons/question-circle.svg";

/**
 * Hook to resolve token info for a given symbol
 * Resolution order:
 * 1. Try getToken from constants
 * 2. Try TOKEN_SYMBOLS_MAP directly (local definitions)
 * 3. Fallback to swap tokens from API
 *
 * If chainId is provided, applies chain-specific display modifications (e.g., USDT -> USDT0)
 */
export function useToken(
  symbol: string,
  chainId?: number
): TokenInfo | undefined {
  const { data: swapTokens } = useSwapTokens();

  const token = useMemo(() => {
    let resolvedToken: TokenInfo | undefined;

    // Try to get token from constants first
    try {
      resolvedToken = getToken(symbol);
    } catch (error) {
      // If getToken fails, try TOKEN_SYMBOLS_MAP directly
      const tokenFromMap =
        TOKEN_SYMBOLS_MAP[
          symbol.toUpperCase() as keyof typeof TOKEN_SYMBOLS_MAP
        ];

      if (tokenFromMap) {
        // Get logoURI from orderedTokenLogos or use unknown logo
        const logoURI =
          orderedTokenLogos[
            symbol.toUpperCase() as keyof typeof orderedTokenLogos
          ] || unknownLogo;

        resolvedToken = {
          ...tokenFromMap,
          logoURI,
        } as TokenInfo;
      } else if (swapTokens) {
        // If still not found, try to find it in swap API data
        // Search across all chains for a token with matching symbol
        // Note: swapTokens is now already converted to TokenInfo[]
        const foundToken = swapTokens.find(
          (t) => t.symbol.toUpperCase() === symbol.toUpperCase()
        );

        if (foundToken) {
          resolvedToken = foundToken;
        }
      }

      // If still not found, log warning
      if (!resolvedToken) {
        console.warn(`Unable to resolve token info for symbol ${symbol}`);
        return undefined;
      }
    }

    // Apply chain-specific display modifications if chainId is provided
    if (chainId !== undefined) {
      return applyChainSpecificTokenDisplay(resolvedToken, chainId);
    }

    return resolvedToken;
  }, [symbol, chainId, swapTokens]);

  return token;
}
