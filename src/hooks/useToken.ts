import { useMemo } from "react";
import {
  getToken,
  TOKEN_SYMBOLS_MAP,
  TokenInfo,
  applyChainSpecificTokenDisplay,
  getConfig,
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
  symbol?: string,
  chainId?: number
): TokenInfo | undefined {
  const { data: swapTokens } = useSwapTokens();

  const token = useMemo(() => {
    let resolvedToken: TokenInfo | undefined;

    if (!symbol) {
      return;
    }

    // Try to get token from constants first
    try {
      resolvedToken = chainId
        ? getConfig().getTokenInfoBySymbol(chainId, symbol)
        : getToken(symbol);
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

/**
 * Hook to resolve token info for a given address
 * Resolution order:
 * 1. Try getConfig().getTokenInfoByAddressSafe if chainId is provided
 * 2. Try TOKEN_SYMBOLS_MAP by searching addresses (across all chains or specific chain)
 * 3. Fallback to swap tokens from API
 *
 * If chainId is provided, applies chain-specific display modifications (e.g., USDT -> USDT0)
 */
export function useTokenFromAddress(
  address: string,
  chainId?: number
): TokenInfo | undefined {
  const { data: swapTokens } = useSwapTokens();
  const config = getConfig();

  const token = useMemo(() => {
    let resolvedToken: TokenInfo | undefined;

    const normalizedAddress = address.toLowerCase();

    // First, try getConfig().getTokenInfoByAddressSafe if chainId is provided
    if (chainId !== undefined) {
      const configToken = config.getTokenInfoByAddressSafe(
        chainId,
        normalizedAddress
      );
      if (configToken) {
        resolvedToken = configToken as TokenInfo;
      }
    }

    // If not found, try TOKEN_SYMBOLS_MAP by searching addresses
    if (!resolvedToken) {
      const tokenEntries = Object.entries(TOKEN_SYMBOLS_MAP);
      const matchingToken = tokenEntries.find(([_symbol, tokenData]) => {
        if (!tokenData.addresses) {
          return false;
        }
        if (chainId !== undefined) {
          // If chainId is provided, check only that chain's address
          return (
            tokenData.addresses[chainId]?.toLowerCase() === normalizedAddress
          );
        } else {
          // Otherwise, check all addresses
          return Object.values(tokenData.addresses).some(
            (addr) => addr?.toLowerCase() === normalizedAddress
          );
        }
      });

      if (matchingToken) {
        const [symbol, tokenData] = matchingToken;
        // Get logoURI from orderedTokenLogos or use unknown logo
        const logoURI =
          orderedTokenLogos[
            symbol.toUpperCase() as keyof typeof orderedTokenLogos
          ] || unknownLogo;

        resolvedToken = {
          ...tokenData,
          logoURI,
        } as TokenInfo;
      }
    }

    // If still not found, try swap tokens from API
    if (!resolvedToken && swapTokens) {
      const foundToken = swapTokens.find((t) => {
        if (!t.addresses) {
          return false;
        }
        if (chainId !== undefined) {
          // If chainId is provided, check only that chain's address
          return t.addresses[chainId]?.toLowerCase() === normalizedAddress;
        } else {
          // Otherwise, check all addresses
          return Object.values(t.addresses).some(
            (addr) => addr?.toLowerCase() === normalizedAddress
          );
        }
      });

      if (foundToken) {
        resolvedToken = foundToken;
      }
    }

    // If still not found, log warning
    if (!resolvedToken) {
      console.warn(
        `Unable to resolve token info for address ${address}${
          chainId ? ` on chain ${chainId}` : ""
        }`
      );
      return undefined;
    }

    // Apply chain-specific display modifications if chainId is provided
    if (chainId !== undefined) {
      return applyChainSpecificTokenDisplay(resolvedToken, chainId);
    }

    return resolvedToken;
  }, [address, chainId, swapTokens, config]);

  return token;
}
