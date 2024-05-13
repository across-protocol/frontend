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
  similarTokenPairs,
  getOutputTokenSymbol,
  PriorityFilterKey,
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
    (inputOrSwapTokenSymbol: string) => {
      const baseFilter = {
        fromChain: selectedRoute.fromChain,
        toChain: selectedRoute.toChain,
        outputTokenSymbol: getOutputTokenSymbol(
          inputOrSwapTokenSymbol,
          selectedRoute.toTokenAddress
        ),
      };
      const route =
        findNextBestRoute(["inputTokenSymbol", "fromChain", "toChain"], {
          ...baseFilter,
          inputTokenSymbol: inputOrSwapTokenSymbol,
        }) ||
        findNextBestRoute(["swapTokenSymbol", "fromChain", "toChain"], {
          ...baseFilter,
          swapTokenSymbol: inputOrSwapTokenSymbol,
        }) ||
        findNextBestRoute(["inputTokenSymbol", "fromChain"], {
          ...baseFilter,
          inputTokenSymbol: inputOrSwapTokenSymbol,
        }) ||
        findNextBestRoute(["swapTokenSymbol", "fromChain"], {
          ...baseFilter,
          swapTokenSymbol: inputOrSwapTokenSymbol,
        }) ||
        findNextBestRoute(["inputTokenSymbol"], {
          ...baseFilter,
          inputTokenSymbol: inputOrSwapTokenSymbol,
        }) ||
        findNextBestRoute(["swapTokenSymbol"], {
          ...baseFilter,
          swapTokenSymbol: inputOrSwapTokenSymbol,
        }) ||
        initialRoute;

      setSelectedRoute(route);

      addToAmpliQueue(() => {
        trackTokenChanged(route.fromTokenSymbol);
      });
    },
    [selectedRoute, addToAmpliQueue]
  );

  const handleSelectOutputToken = useCallback(
    (outputTokenSymbol: string) => {
      const baseFilter = {
        fromChain: selectedRoute.fromChain,
        toChain: selectedRoute.toChain,
        outputTokenSymbol,
      };
      const route =
        findNextBestRoute(["outputTokenSymbol"], {
          ...baseFilter,
          outputTokenSymbol,
          inputTokenSymbol: selectedRoute.fromTokenSymbol,
          swapTokenSymbol:
            selectedRoute.type === "swap"
              ? selectedRoute.swapTokenSymbol
              : undefined,
        }) || initialRoute;

      setSelectedRoute(route);
    },
    [selectedRoute]
  );

  const handleSelectFromChain = useCallback(
    (fromChainId: number) => {
      const isSwap = selectedRoute.type === "swap";
      const filterBy = {
        inputTokenSymbol: isSwap ? undefined : selectedRoute.fromTokenSymbol,
        swapTokenSymbol: isSwap ? selectedRoute.swapTokenSymbol : undefined,
        outputTokenSymbol: getOutputTokenSymbol(
          selectedRoute.fromTokenSymbol,
          selectedRoute.toTokenSymbol
        ),
        fromChain: fromChainId,
        toChain: selectedRoute.toChain,
      };
      const similarTokenSymbols =
        similarTokenPairs[
          isSwap ? selectedRoute.swapTokenSymbol : selectedRoute.fromTokenSymbol
        ] || [];
      const findNextBestRouteBySimilarToken = (
        priorityFilterKeys: PriorityFilterKey[]
      ) => {
        for (const similarTokenSymbol of similarTokenSymbols) {
          const route = findNextBestRoute(priorityFilterKeys, {
            ...filterBy,
            inputTokenSymbol: similarTokenSymbol,
          });
          if (route) {
            return route;
          }
        }
      };
      const route =
        findNextBestRoute(
          [
            "fromChain",
            "toChain",
            isSwap ? "swapTokenSymbol" : "inputTokenSymbol",
          ],
          filterBy
        ) ||
        findNextBestRouteBySimilarToken([
          "fromChain",
          "toChain",
          "inputTokenSymbol",
        ]) ||
        findNextBestRoute(["fromChain", "toChain"], filterBy) ||
        findNextBestRoute(["fromChain", "toChain"], {
          ...filterBy,
          outputTokenSymbol: undefined,
        }) ||
        findNextBestRoute(["fromChain"], {
          fromChain: fromChainId,
        }) ||
        findNextBestRoute(
          ["fromChain", isSwap ? "swapTokenSymbol" : "inputTokenSymbol"],
          filterBy
        ) ||
        initialRoute;

      setSelectedRoute(route);

      addToAmpliQueue(() => {
        trackFromChainChanged(route.fromChain);
      });
    },
    [selectedRoute, addToAmpliQueue]
  );

  const handleSelectToChain = useCallback(
    (toChainId: number) => {
      const isSwap = selectedRoute.type === "swap";
      const filterBy = {
        inputTokenSymbol: isSwap ? undefined : selectedRoute.fromTokenSymbol,
        swapTokenSymbol: isSwap ? selectedRoute.swapTokenSymbol : undefined,
        outputTokenSymbol: getOutputTokenSymbol(
          selectedRoute.fromTokenSymbol,
          selectedRoute.toTokenSymbol
        ),
        fromChain: selectedRoute.fromChain,
        toChain: toChainId,
      };
      const route =
        findNextBestRoute(
          [
            "fromChain",
            "toChain",
            isSwap ? "swapTokenSymbol" : "inputTokenSymbol",
          ],
          filterBy
        ) ||
        findNextBestRoute(["fromChain", "toChain"], filterBy) ||
        findNextBestRoute(["fromChain", "toChain"], {
          ...filterBy,
          outputTokenSymbol: undefined,
        }) ||
        findNextBestRoute(["fromChain"], {
          toChain: toChainId,
        }) ||
        findNextBestRoute(
          ["toChain", isSwap ? "swapTokenSymbol" : "inputTokenSymbol"],
          filterBy
        ) ||
        initialRoute;

      setSelectedRoute(route);

      addToAmpliQueue(() => {
        trackToChainChanged(route.toChain);
      });
    },
    [selectedRoute, addToAmpliQueue]
  );

  const handleQuickSwap = useCallback(() => {
    const isSwap = selectedRoute.type === "swap";
    const baseFilter = {
      outputTokenSymbol: isSwap
        ? selectedRoute.swapTokenSymbol
        : selectedRoute.fromTokenSymbol,
      fromChain: selectedRoute.toChain,
      toChain: selectedRoute.fromChain,
    };
    const route =
      findNextBestRoute(["fromChain", "toChain", "inputTokenSymbol"], {
        ...baseFilter,
        inputTokenSymbol: selectedRoute.toTokenSymbol,
      }) ||
      findNextBestRoute(["fromChain", "toChain", "swapTokenSymbol"], {
        ...baseFilter,
        swapTokenSymbol: selectedRoute.toTokenSymbol,
      }) ||
      findNextBestRoute(["fromChain", "toChain"], {
        ...baseFilter,
        inputTokenSymbol: selectedRoute.toTokenSymbol,
      }) ||
      initialRoute;

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
