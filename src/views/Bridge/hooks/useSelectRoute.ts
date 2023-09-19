import { useCallback, useState, useEffect } from "react";

import {
  trackFromChainChanged,
  trackToChainChanged,
  trackTokenChanged,
  trackQuickSwap,
} from "utils";
import { useAmplitude } from "hooks";

import { getInitialRouteFromQueryParams, findNextBestRoute } from "../utils";

const initialRoute = getInitialRouteFromQueryParams();

export function useSelectRoute() {
  const [selectedRoute, setSelectedRoute] = useState(initialRoute);
  const [isDefaultRouteTracked, setIsDefaultRouteTracked] = useState(false);

  const { addToAmpliQueue } = useAmplitude();

  useEffect(() => {
    if (isDefaultRouteTracked) {
      return;
    }

    addToAmpliQueue(() => {
      trackTokenChanged(selectedRoute.fromTokenSymbol, true);
      trackFromChainChanged(selectedRoute.fromChain, true);
      trackToChainChanged(selectedRoute.toChain, true);
    });
    setIsDefaultRouteTracked(true);
  }, [selectedRoute, addToAmpliQueue, isDefaultRouteTracked]);

  const handleSelectToken = useCallback(
    (tokenSymbol: string) => {
      const route =
        findNextBestRoute(["symbol"], {
          symbol: tokenSymbol,
          fromChain: selectedRoute.fromChain,
          toChain: selectedRoute.toChain,
        }) || getInitialRouteFromQueryParams();

      setSelectedRoute(route);

      addToAmpliQueue(() => {
        trackTokenChanged(route.fromTokenSymbol);
      });
    },
    [selectedRoute.fromChain, selectedRoute.toChain, addToAmpliQueue]
  );

  const handleSelectFromChain = useCallback(
    (fromChainId: number) => {
      const filterBy = {
        symbol: selectedRoute.fromTokenSymbol,
        fromChain: fromChainId,
        toChain: selectedRoute.toChain,
      };
      const route =
        findNextBestRoute(["fromChain", "toChain"], filterBy) ||
        findNextBestRoute(["fromChain", "symbol"], filterBy) ||
        initialRoute;

      setSelectedRoute(route);

      addToAmpliQueue(() => {
        trackFromChainChanged(route.fromChain);
      });
    },
    [selectedRoute.fromTokenSymbol, selectedRoute.toChain, addToAmpliQueue]
  );

  const handleSelectToChain = useCallback(
    (toChainId: number) => {
      const filterBy = {
        symbol: selectedRoute.fromTokenSymbol,
        fromChain: selectedRoute.fromChain,
        toChain: toChainId,
      };
      const route =
        findNextBestRoute(["fromChain", "toChain"], filterBy) ||
        findNextBestRoute(["symbol", "toChain"], filterBy) ||
        initialRoute;

      setSelectedRoute(route);

      addToAmpliQueue(() => {
        trackToChainChanged(route.toChain);
      });
    },
    [selectedRoute.fromTokenSymbol, selectedRoute.fromChain, addToAmpliQueue]
  );

  const handleQuickSwap = useCallback(() => {
    const route = findNextBestRoute(["fromChain", "toChain"], {
      symbol: selectedRoute.fromTokenSymbol,
      fromChain: selectedRoute.toChain,
      toChain: selectedRoute.fromChain,
    });

    if (route) {
      setSelectedRoute(route);

      addToAmpliQueue(() => {
        trackFromChainChanged(route.fromChain);
        trackToChainChanged(route.toChain);
        trackQuickSwap("bridgeForm");
      });
    }
  }, [selectedRoute, addToAmpliQueue]);

  return {
    selectedRoute,
    handleSelectToken,
    handleSelectFromChain,
    handleSelectToChain,
    handleQuickSwap,
  };
}
