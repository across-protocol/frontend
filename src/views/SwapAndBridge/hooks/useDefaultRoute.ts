import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnectionEVM } from "hooks/useConnectionEVM";
import { useEnrichedCrosschainBalances } from "hooks/useEnrichedCrosschainBalances";
import { CHAIN_IDs } from "utils";
import { EnrichedToken } from "../components/ChainTokenSelector/ChainTokenSelectorModal";
import { useConnectionSVM } from "hooks/useConnectionSVM";
import { usePrevious } from "@uidotdev/usehooks";

type DefaultRoute = {
  inputToken: EnrichedToken | null;
  outputToken: EnrichedToken | null;
};

/**
 * Parse query params from URL to get route preferences
 */
function getRouteFromQueryParams() {
  const params = new URLSearchParams(window.location.search);

  const fromChain = Number(params.get("from")) || undefined;
  const toChain = Number(params.get("to")) || undefined;
  const inputTokenSymbol = params.get("inputToken") || undefined;
  const outputTokenSymbol = params.get("outputToken") || undefined;

  return {
    fromChain,
    toChain,
    inputTokenSymbol: inputTokenSymbol?.toUpperCase(),
    outputTokenSymbol: outputTokenSymbol?.toUpperCase(),
  };
}

export function useDefaultRoute(): DefaultRoute {
  const [defaultInputToken, setDefaultInputToken] =
    useState<EnrichedToken | null>(null);
  const [defaultOutputToken, setDefaultOutputToken] =
    useState<EnrichedToken | null>(null);
  const [hasSetInitial, setHasSetInitial] = useState(false);
  const [hasSetConnected, setHasSetConnected] = useState(false);

  const { isConnected: isConnectedEVM, chainId: chainIdEVM } =
    useConnectionEVM();
  const { isConnected: isConnectedSVM, chainId: chainIdSVM } =
    useConnectionSVM();
  const routeData = useEnrichedCrosschainBalances();

  const anyConnected = isConnectedEVM || isConnectedSVM;
  const previouslyConnected = usePrevious(anyConnected);
  const chainId = chainIdEVM || chainIdSVM;
  const hasRouteData = Object.keys(routeData).length ? true : false;

  const findUsdcToken = useCallback(
    (targetChainId: number) => {
      const tokensOnChain = routeData[targetChainId] || [];
      return tokensOnChain.find(
        (token) => token.symbol.toUpperCase() === "USDC"
      );
    },
    [routeData]
  );

  const findToken = useCallback(
    (targetChainId: number, symbol: string) => {
      const tokensOnChain = routeData[targetChainId] || [];
      return tokensOnChain.find(
        (token) => token.symbol.toUpperCase() === symbol.toUpperCase()
      );
    },
    [routeData]
  );

  // initial load
  useEffect(() => {
    // Wait for balances to be available
    if (!hasRouteData || hasSetInitial) {
      return;
    }

    // Check query params first
    const queryParams = getRouteFromQueryParams();

    if (
      queryParams.fromChain &&
      queryParams.toChain &&
      queryParams.inputTokenSymbol
    ) {
      // Try to find tokens from query params
      const inputToken = findToken(
        queryParams.fromChain,
        queryParams.inputTokenSymbol
      );
      const outputToken = queryParams.outputTokenSymbol
        ? findToken(queryParams.toChain, queryParams.outputTokenSymbol)
        : undefined;

      if (inputToken) {
        setDefaultInputToken(inputToken);
        setDefaultOutputToken(outputToken ?? null);
        setHasSetInitial(true);
        return;
      }
    }

    // Fallback to default: Base -> Arbitrum
    const inputToken = findUsdcToken(CHAIN_IDs.BASE);
    const outputToken = findUsdcToken(CHAIN_IDs.ARBITRUM);
    setDefaultInputToken(inputToken ?? null);
    setDefaultOutputToken(outputToken ?? null);
    setHasSetInitial(true);
  }, [findUsdcToken, findToken, hasSetInitial, hasRouteData]);

  // connect wallet
  useEffect(() => {
    // Wait for balances to be available
    if (!hasRouteData) {
      return;
    }

    // only first connection - also check hasSetConnected to prevent infinite loop
    // Also skip if we've already set initial tokens (they might be from query params)
    if (
      !previouslyConnected &&
      anyConnected &&
      chainId &&
      !hasSetConnected &&
      !hasSetInitial
    ) {
      // Check query params first - if they're set, use them instead of wallet-based defaults
      const queryParams = getRouteFromQueryParams();

      if (
        queryParams.fromChain &&
        queryParams.toChain &&
        queryParams.inputTokenSymbol
      ) {
        const inputToken = findToken(
          queryParams.fromChain,
          queryParams.inputTokenSymbol
        );
        const outputToken = queryParams.outputTokenSymbol
          ? findToken(queryParams.toChain, queryParams.outputTokenSymbol)
          : undefined;

        if (inputToken) {
          setDefaultInputToken(inputToken);
          setDefaultOutputToken(outputToken ?? null);
          setHasSetConnected(true);
          setHasSetInitial(true);
          return;
        }
      }

      // Fallback to wallet-based defaults
      let inputToken: EnrichedToken | undefined;
      let outputToken: EnrichedToken | undefined;

      if (chainId === CHAIN_IDs.ARBITRUM) {
        // Special case: If on Arbitrum, use Arbitrum -> Base
        inputToken = findUsdcToken(CHAIN_IDs.ARBITRUM);
        outputToken = findUsdcToken(CHAIN_IDs.BASE);
      } else {
        // Use wallet's current network -> Arbitrum
        inputToken = findUsdcToken(chainId);
        outputToken = findUsdcToken(CHAIN_IDs.ARBITRUM);
      }

      setDefaultInputToken(inputToken || null);
      setDefaultOutputToken(outputToken || null);
      setHasSetConnected(true);
      setHasSetInitial(true);
    }
  }, [
    anyConnected,
    hasRouteData,
    chainId,
    findUsdcToken,
    findToken,
    previouslyConnected,
    hasSetConnected,
    hasSetInitial,
  ]);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(
    () => ({
      inputToken: defaultInputToken,
      outputToken: defaultOutputToken,
    }),
    [defaultInputToken, defaultOutputToken]
  );
}
