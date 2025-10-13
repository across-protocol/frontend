import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnectionEVM } from "hooks/useConnectionEVM";
import { useEnrichedCrosschainBalances } from "hooks/useEnrichedCrosschainBalances";
import { CHAIN_IDs } from "utils";
import { EnrichedToken } from "../components/ChainTokenSelector/Modal";
import { useConnectionSVM } from "hooks/useConnectionSVM";
import { usePrevious } from "@uidotdev/usehooks";

type DefaultRoute = {
  inputToken: EnrichedToken | null;
  outputToken: EnrichedToken | null;
};

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

  // initial load
  useEffect(() => {
    // Wait for balances to be available
    if (!hasRouteData || hasSetInitial) {
      return;
    }
    // Wallet is not connected: Base -> Arbitrum
    const inputToken = findUsdcToken(CHAIN_IDs.BASE);
    const outputToken = findUsdcToken(CHAIN_IDs.ARBITRUM);
    setDefaultInputToken(inputToken ?? null);
    setDefaultOutputToken(outputToken ?? null);
    setHasSetInitial(true);
  }, [findUsdcToken, hasSetInitial, hasRouteData]);

  // connect wallet
  useEffect(() => {
    // Wait for balances to be available
    if (!hasRouteData) {
      return;
    }

    // only first connection - also check hasSetConnected to prevent infinite loop
    if (!previouslyConnected && anyConnected && chainId && !hasSetConnected) {
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
    }
  }, [
    anyConnected,
    hasRouteData,
    chainId,
    findUsdcToken,
    previouslyConnected,
    hasSetConnected,
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
