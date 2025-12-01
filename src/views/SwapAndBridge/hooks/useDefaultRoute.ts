import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnectionEVM } from "hooks/useConnectionEVM";
import { useEnrichedCrosschainBalances } from "hooks/useEnrichedCrosschainBalances";
import { CHAIN_IDs, chainEndpointToId, TOKEN_SYMBOLS_MAP } from "utils";
import { EnrichedToken } from "../components/ChainTokenSelector/ChainTokenSelectorModal";
import { useConnectionSVM } from "hooks/useConnectionSVM";

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
  const toChainFromParam = Number(params.get("to")) || undefined;
  const inputTokenSymbol = params.get("inputToken") || undefined;
  const outputTokenSymbol = params.get("outputToken") || undefined;
  const vanityPath = window.location.pathname.substring(1);

  const preferredToChain = Object.values(chainEndpointToId).find((v) =>
    v.vanity.includes(vanityPath.toLowerCase())
  );

  const toChain = toChainFromParam ?? preferredToChain?.chainId;

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
  const [hasSetFromConnected, setHasSetFromConnected] = useState(false);

  const { chainId: chainIdEVM } = useConnectionEVM();
  const { chainId: chainIdSVM } = useConnectionSVM();
  const routeData = useEnrichedCrosschainBalances();

  const connectedChainId = chainIdEVM || chainIdSVM;
  const hasRouteData = Object.keys(routeData).length ? true : false;

  const findUsdcTokenWithFallback = useCallback(
    (targetChainId: number) => {
      const tokensOnChain = routeData[targetChainId] || [];
      const usdc = tokensOnChain.find(
        (token) => token.symbol.toUpperCase() === "USDC"
      );

      return usdc ?? tokensOnChain?.[0];
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

  const selectTokens = useCallback(
    (
      fromChainOverride: number | undefined,
      defaultInputChainId: number,
      defaultOutputChainId: number
    ): {
      inputToken: EnrichedToken | null;
      outputToken: EnrichedToken | null;
    } => {
      const queryParams = getRouteFromQueryParams();

      const inputChainId =
        queryParams.fromChain ?? fromChainOverride ?? defaultInputChainId;
      let outputChainId = queryParams.toChain ?? defaultOutputChainId;

      // Ensure input & output chains are never the same
      if (inputChainId === outputChainId) {
        if (defaultOutputChainId !== inputChainId) {
          outputChainId = defaultOutputChainId;
        } else {
          // fallback
          outputChainId =
            inputChainId !== CHAIN_IDs.ARBITRUM
              ? CHAIN_IDs.ARBITRUM
              : CHAIN_IDs.BASE;
        }
      }

      const inputTokenSymbol =
        queryParams.inputTokenSymbol ?? TOKEN_SYMBOLS_MAP.USDC.symbol;
      const outputTokenSymbol =
        queryParams.outputTokenSymbol ?? TOKEN_SYMBOLS_MAP.USDC.symbol;

      const inputToken =
        findToken(inputChainId, inputTokenSymbol) ??
        findUsdcTokenWithFallback(inputChainId) ??
        null;

      const outputToken =
        findToken(outputChainId, outputTokenSymbol) ??
        findUsdcTokenWithFallback(outputChainId) ??
        null;

      return {
        inputToken,
        outputToken,
      };
    },
    [findToken, findUsdcTokenWithFallback]
  );

  const selectTokensOnLoad = useCallback(() => {
    const { inputToken, outputToken } = selectTokens(
      undefined,
      CHAIN_IDs.BASE,
      CHAIN_IDs.ARBITRUM
    );
    if (inputToken && outputToken) {
      setDefaultInputToken(inputToken);
      setDefaultOutputToken(outputToken);
      setHasSetInitial(true);
    }
  }, [selectTokens]);

  const selectTokensOnWalletConnect = useCallback(() => {
    const { inputToken, outputToken } = selectTokens(
      connectedChainId,
      CHAIN_IDs.BASE,
      CHAIN_IDs.ARBITRUM
    );
    if (inputToken && outputToken) {
      setDefaultInputToken(inputToken);
      setDefaultOutputToken(outputToken);
      setHasSetFromConnected(true);
    }
  }, [selectTokens, connectedChainId]);

  useEffect(() => {
    // Wait for balances to be available
    if (!hasRouteData) {
      return;
    }

    if (!hasSetInitial) {
      selectTokensOnLoad();
      return;
    }

    if (!hasSetFromConnected) {
      selectTokensOnWalletConnect();
      return;
    }
  }, [
    selectTokens,
    hasSetInitial,
    hasRouteData,
    connectedChainId,
    selectTokensOnWalletConnect,
    selectTokensOnLoad,
    hasSetFromConnected,
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
