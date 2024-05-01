import { useCallback, useState, useEffect } from "react";

import {
  trackFromChainChanged,
  trackToChainChanged,
  trackTokenChanged,
  trackQuickSwap,
} from "utils";
import { useAmplitude } from "hooks";

import {
  getRouteFromQueryParams,
  findNextBestRoute,
  SelectedRoute,
} from "../utils";

const initialRoute = getRouteFromQueryParams();

export function useSelectRoute() {
  const [selectedRoute, setSelectedRoute] =
    useState<SelectedRoute>(initialRoute);
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

  const handleSelectInputToken = useCallback(
    (inputTokenSymbol: string) => {
      const route =
        findNextBestRoute(["inputTokenSymbol"], {
          inputTokenSymbol,
          fromChain: selectedRoute.fromChain,
          toChain: selectedRoute.toChain,
        }) || initialRoute;

      setSelectedRoute(route);

      addToAmpliQueue(() => {
        trackTokenChanged(route.fromTokenSymbol);
      });
    },
    [selectedRoute.fromChain, selectedRoute.toChain, addToAmpliQueue]
  );

  const handleSelectOutputToken = useCallback(
    (outputTokenSymbol: string) => {
      const route =
        findNextBestRoute(["outputTokenSymbol"], {
          outputTokenSymbol,
          inputTokenSymbol: selectedRoute.fromTokenSymbol,
          fromChain: selectedRoute.fromChain,
          toChain: selectedRoute.toChain,
        }) || initialRoute;

      setSelectedRoute(route);
    },
    [
      selectedRoute.fromChain,
      selectedRoute.toChain,
      selectedRoute.fromTokenSymbol,
    ]
  );

  const handleSelectFromChain = useCallback(
    (fromChainId: number) => {
      const filterBy = {
        inputTokenSymbol: selectedRoute.fromTokenSymbol,
        fromChain: fromChainId,
        toChain: selectedRoute.toChain,
      };
      const route =
        findNextBestRoute(["fromChain", "toChain"], filterBy) ||
        findNextBestRoute(["fromChain", "inputTokenSymbol"], filterBy) ||
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
        inputTokenSymbol: selectedRoute.fromTokenSymbol,
        fromChain: selectedRoute.fromChain,
        toChain: toChainId,
      };
      const route =
        findNextBestRoute(["fromChain", "toChain"], filterBy) ||
        findNextBestRoute(["inputTokenSymbol", "toChain"], filterBy) ||
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
      inputTokenSymbol: selectedRoute.fromTokenSymbol,
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
    handleSelectInputToken,
    handleSelectOutputToken,
    handleSelectFromChain,
    handleSelectToChain,
    handleQuickSwap,
  };
}
