import { useCallback, useState, useEffect } from "react";

import {
  trackFromChainChanged,
  trackToChainChanged,
  trackTokenChanged,
  trackQuickSwap,
  similarTokensMap,
  externalProjectNameToId,
} from "utils";
import { useAmplitude, useConnection } from "hooks";

import {
  findNextBestRoute,
  SelectedRoute,
  getOutputTokenSymbol,
  PriorityFilterKey,
  getInitialRoute,
  getTokenDefaultsForRoute,
} from "../utils";

const initialRoute = getInitialRoute();

export function useSelectRoute() {
  const { chainId: walletChainId, isConnected } = useConnection();
  const [selectedRoute, setSelectedRoute] =
    useState<SelectedRoute>(getInitialRoute());
  const [isDefaultRouteTracked, setIsDefaultRouteTracked] = useState(false);

  const { addToAmpliQueue } = useAmplitude();

  // set default fromChain when user first connects
  useEffect(() => {
    if (isConnected) {
      setSelectedRoute(getInitialRoute({ fromChain: walletChainId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  useEffect(() => {
    if (isDefaultRouteTracked) {
      return;
    }

    addToAmpliQueue(() => {
      trackTokenChanged(selectedRoute.fromTokenSymbol, true);
      trackFromChainChanged(selectedRoute.fromChain, true);
      trackToChainChanged(
        selectedRoute.toChain,
        externalProjectNameToId(selectedRoute.externalProjectId),
        true
      );
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
      const _route =
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

      const route = getTokenDefaultsForRoute(_route);
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
              : selectedRoute.type === "universal-swap"
                ? selectedRoute.fromTokenSymbol
                : undefined,
        }) || initialRoute;

      setSelectedRoute(route);
    },
    [selectedRoute]
  );

  const handleSelectFromChain = useCallback(
    (fromChainId: number, _externalProjectId?: string) => {
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
        externalProjectId: selectedRoute.externalProjectId,
      };

      const similarTokenSymbols =
        similarTokensMap[
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
        // First try with external project ID if it exists
        (filterBy.externalProjectId &&
          (findNextBestRoute(
            [
              "fromChain",
              "toChain",
              "externalProjectId",
              isSwap ? "swapTokenSymbol" : "inputTokenSymbol",
            ],
            filterBy
          ) ||
            findNextBestRoute(
              ["fromChain", "toChain", "externalProjectId"],
              filterBy
            ))) ||
        // Then try without external project ID constraints
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
          externalProjectId: undefined,
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
    (toChainId: number, externalProjectId?: string) => {
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
        externalProjectId,
      };

      // Try to find route with exact match first
      let route = externalProjectId
        ? findNextBestRoute(["fromChain", "toChain", "externalProjectId"], {
            toChain: toChainId,
            externalProjectId,
            fromChain: selectedRoute.fromChain,
          }) ||
          findNextBestRoute(["toChain", "externalProjectId"], {
            toChain: toChainId,
            externalProjectId,
          })
        : findNextBestRoute(
            [
              "fromChain",
              "toChain",
              isSwap ? "swapTokenSymbol" : "inputTokenSymbol",
            ],
            filterBy
          );

      // If no route found, fall back to previous logic
      if (!route) {
        route =
          findNextBestRoute(
            [
              "fromChain",
              "toChain",
              "externalProjectId",
              isSwap ? "swapTokenSymbol" : "inputTokenSymbol",
            ],
            filterBy
          ) ||
          findNextBestRoute(
            ["fromChain", "toChain", "externalProjectId"],
            filterBy
          ) ||
          (externalProjectId &&
            findNextBestRoute(["fromChain", "toChain", "externalProjectId"], {
              fromChain: selectedRoute.fromChain,
              toChain: toChainId,
              externalProjectId,
            })) ||
          (externalProjectId === undefined &&
            (findNextBestRoute(
              [
                "fromChain",
                "toChain",
                isSwap ? "swapTokenSymbol" : "inputTokenSymbol",
              ],
              { ...filterBy, externalProjectId: undefined }
            ) ||
              findNextBestRoute(["fromChain", "toChain"], {
                ...filterBy,
                outputTokenSymbol: undefined,
                externalProjectId: undefined,
              }))) ||
          findNextBestRoute(["fromChain"], {
            toChain: toChainId,
          }) ||
          findNextBestRoute(
            ["toChain", isSwap ? "swapTokenSymbol" : "inputTokenSymbol"],
            filterBy
          ) ||
          initialRoute;
      }

      setSelectedRoute(route);

      addToAmpliQueue(() => {
        trackToChainChanged(
          route.toChain,
          externalProjectNameToId(route.externalProjectId)
        );
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
        trackToChainChanged(
          route.toChain,
          externalProjectNameToId(route.externalProjectId)
        );
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
