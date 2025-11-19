import { useMemo } from "react";
import { TokenInfo, applyChainSpecificTokenDisplay, getConfig } from "utils";
import { useSwapTokens } from "./useSwapTokens";

const config = getConfig();

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

    // First try local
    try {
      resolvedToken = config.getTokenInfoBySymbolSafe(chainId ?? 1, symbol);
    } catch (error) {
      if (swapTokens) {
        // If still not found, try swap tokens from API
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
    if (chainId !== undefined && resolvedToken) {
      return applyChainSpecificTokenDisplay(resolvedToken, chainId);
    }

    return resolvedToken;
  }, [symbol, chainId, swapTokens]);

  return token;
}

/**
 * Hook to resolve token info for a given address
 * Resolution order:
 * 1. Try getConfig().getTokenInfoByAddressSafe if chainId is provided (resolves via TOKEN_SYMBOLS_MAP)
 * 2. Fallback to swap tokens from API
 *
 * If chainId is provided, applies chain-specific display modifications (e.g., USDT -> USDT0)
 */

export function useTokenFromAddress(
  address: string,
  chainId?: number
): TokenInfo | undefined {
  const { data: swapTokens } = useSwapTokens();

  const token = useMemo(() => {
    let resolvedToken: TokenInfo | undefined;

    const normalizedAddress = address.toLowerCase();

    // First, try local token defs
    if (chainId !== undefined) {
      const configToken = config.getTokenInfoByAddressSafe(
        chainId,
        normalizedAddress
      );
      if (configToken) {
        resolvedToken = configToken as TokenInfo;
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
  }, [address, chainId, swapTokens]);

  return token;
}
