import { BigNumber } from "ethers";

import {
  ChainId,
  Route,
  SwapRoute,
  getChainInfo,
  getConfig,
  getToken,
  hubPoolChainId,
  isProductionBuild,
} from "utils";
import { SwapQuoteApiResponse } from "utils/serverless-api/prod/swap-quote";

export type SelectedRoute =
  | (Route & {
      type: "bridge";
    })
  | (SwapRoute & {
      type: "swap";
    });

type RouteFilter = Partial<{
  inputTokenSymbol: string;
  swapTokenSymbol: string;
  outputTokenSymbol: string;
  fromChain: number;
  toChain: number;
}>;

export enum AmountInputError {
  INVALID = "invalid",
  INSUFFICIENT_LIQUIDITY = "insufficientLiquidity",
  INSUFFICIENT_BALANCE = "insufficientBalance",
  AMOUNT_TOO_LOW = "amountTooLow",
}
const config = getConfig();
const enabledRoutes = config.getEnabledRoutes();
const swapRoutes = config.getSwapRoutes();

const interchangeableTokenPairs: Record<string, string[]> = {
  "USDC.e": ["USDbC"],
  USDbC: ["USDC.e"],
  ETH: ["WETH"],
  WETH: ["ETH"],
};

export function areTokensInterchangeable(
  tokenSymbol1: string,
  tokenSymbol2: string
) {
  return (
    Boolean(interchangeableTokenPairs[tokenSymbol1]) &&
    interchangeableTokenPairs[tokenSymbol1].includes(tokenSymbol2)
  );
}

/**
 * Returns the token symbol to be used for the receive token. The protocol bridges
 * ETH/WETH depending on certain conditions:
 * - If the user wants to bridge ETH and destination chain is Polygon, the bridge will send WETH
 * - If the user wants to bridge ETH and the receiver is a contract, the bridge will send WETH
 * - If the user wants to bridge WETH and the receiver is an EOA, the bridge will send ETH
 * @param destinationChainId Destination chain id.
 * @param inputTokenSymbol Input token symbol.
 * @param outputTokenSymbol Output token symbol.
 * @param isReceiverContract Whether the receiver is a contract or not.
 * @returns The token symbol to be used for the receive token.
 */
export function getReceiveTokenSymbol(
  destinationChainId: number,
  inputTokenSymbol: string,
  outputTokenSymbol: string,
  isReceiverContract: boolean
) {
  const isDestinationChainPolygon = destinationChainId === ChainId.POLYGON;

  if (
    inputTokenSymbol === "ETH" &&
    (isDestinationChainPolygon || isReceiverContract)
  ) {
    return "WETH";
  }

  if (
    inputTokenSymbol === "WETH" &&
    !isDestinationChainPolygon &&
    !isReceiverContract
  ) {
    return "ETH";
  }

  return outputTokenSymbol;
}

export function validateBridgeAmount(
  parsedAmountInput?: BigNumber,
  isAmountTooLow?: boolean,
  currentBalance?: BigNumber,
  maxDeposit?: BigNumber,
  amountToBridgeAfterSwap?: BigNumber
) {
  if (!parsedAmountInput || !amountToBridgeAfterSwap) {
    return {
      error: AmountInputError.INVALID,
    };
  }

  if (currentBalance && parsedAmountInput.gt(currentBalance)) {
    return {
      error: AmountInputError.INSUFFICIENT_BALANCE,
    };
  }

  if (maxDeposit && amountToBridgeAfterSwap.gt(maxDeposit)) {
    return {
      error: AmountInputError.INSUFFICIENT_LIQUIDITY,
    };
  }

  if (isAmountTooLow) {
    return {
      error: AmountInputError.AMOUNT_TOO_LOW,
    };
  }

  if (parsedAmountInput.lt(0) || amountToBridgeAfterSwap.lt(0)) {
    return {
      error: AmountInputError.INVALID,
    };
  }

  return {
    error: undefined,
  };
}

export function getInitialRoute(defaults: RouteFilter = {}) {
  return (
    findEnabledRoute({
      inputTokenSymbol: defaults.inputTokenSymbol || "ETH",
      fromChain: defaults.fromChain || hubPoolChainId,
      toChain: defaults.toChain,
    }) || { ...enabledRoutes[0], type: "bridge" }
  );
}

export function findEnabledRoute(
  filter: RouteFilter = {}
): SelectedRoute | undefined {
  const {
    inputTokenSymbol,
    outputTokenSymbol,
    swapTokenSymbol,
    fromChain,
    toChain,
  } = filter;

  const commonRouteFilter = (route: Route | SwapRoute) =>
    (inputTokenSymbol
      ? route.fromTokenSymbol.toUpperCase() === inputTokenSymbol.toUpperCase()
      : true) &&
    (outputTokenSymbol
      ? route.toTokenSymbol.toUpperCase() === outputTokenSymbol.toUpperCase()
      : true) &&
    (fromChain ? route.fromChain === fromChain : true) &&
    (toChain ? route.toChain === toChain : true);

  if (swapTokenSymbol) {
    const swapRoute = swapRoutes.find(
      (route) =>
        (swapTokenSymbol
          ? route.swapTokenSymbol.toUpperCase() ===
            swapTokenSymbol.toUpperCase()
          : true) && commonRouteFilter(route)
    );

    if (swapRoute) {
      return {
        ...swapRoute,
        type: "swap",
      };
    }
  } else {
    const route = enabledRoutes.find((route) => commonRouteFilter(route));

    if (route) {
      return {
        ...route,
        type: "bridge",
      };
    }
  }

  return undefined;
}
/**
 * Returns the next best matching route based on the given priority keys and filter.
 * @param priorityFilterKeys Set of filter keys to use if no route is found based on `filter`.
 * @param filter Filter to apply for best matching route.
 */
export function findNextBestRoute(
  priorityFilterKeys: (
    | "inputTokenSymbol"
    | "swapTokenSymbol"
    | "outputTokenSymbol"
    | "fromChain"
    | "toChain"
  )[],
  filter: RouteFilter = {}
) {
  let route: SelectedRoute | undefined;

  const equivalentInputTokenSymbols = filter.inputTokenSymbol
    ? interchangeableTokenPairs[filter.inputTokenSymbol]
    : undefined;
  const equivalentSwapTokenSymbols = filter.swapTokenSymbol
    ? interchangeableTokenPairs[filter.swapTokenSymbol]
    : undefined;

  route = findEnabledRoute(filter);

  if (!route && equivalentInputTokenSymbols) {
    for (const equivalentTokenSymbol of equivalentInputTokenSymbols) {
      route = findEnabledRoute({
        ...filter,
        inputTokenSymbol: equivalentTokenSymbol,
      });

      if (route) {
        break;
      }
    }
  }

  if (!route && equivalentSwapTokenSymbols) {
    for (const equivalentTokenSymbol of equivalentSwapTokenSymbols) {
      route = findEnabledRoute({
        ...filter,
        swapTokenSymbol: equivalentTokenSymbol,
      });

      if (route) {
        break;
      }
    }
  }

  if (!route) {
    const allFilterKeys = [
      "inputTokenSymbol",
      "swapTokenSymbol",
      "outputTokenSymbol",
      "fromChain",
      "toChain",
    ] as const;
    const nonPriorityFilterKeys = allFilterKeys.filter((key) =>
      priorityFilterKeys.includes(key)
    );

    for (const nonPrioKey of nonPriorityFilterKeys) {
      const priorityFilter = priorityFilterKeys.reduce(
        (acc, priorityFilterKey) => ({
          ...acc,
          [priorityFilterKey]: filter[priorityFilterKey],
        }),
        {}
      );
      route = findEnabledRoute({
        ...priorityFilter,
        [nonPrioKey]: filter[nonPrioKey],
      });
      console.log(
        "#3",
        {
          ...priorityFilter,
          [nonPrioKey]: filter[nonPrioKey],
        },
        priorityFilterKeys,
        route
      );

      if (route) {
        break;
      }
    }
  }

  return route;
}

export function getAllTokens() {
  const routeTokens = enabledRoutes.map((route) =>
    getToken(route.fromTokenSymbol)
  );
  const swapTokens = swapRoutes.map((route) => getToken(route.swapTokenSymbol));
  return [...routeTokens, ...swapTokens].filter(
    (token, index, self) =>
      index === self.findIndex((t) => t.symbol === token.symbol)
  );
}

export function getAvailableInputTokens(
  selectedFromChain: number,
  selectedToChain: number
) {
  const routeTokens = enabledRoutes
    .filter(
      (route) =>
        route.fromChain === selectedFromChain &&
        route.toChain === selectedToChain
    )
    .map((route) => getToken(route.fromTokenSymbol));
  const swapTokens = swapRoutes
    .filter(
      (route) =>
        route.fromChain === selectedFromChain &&
        route.toChain === selectedToChain
    )
    .map((route) => getToken(route.swapTokenSymbol));
  return [...routeTokens, ...swapTokens].filter(
    (token, index, self) =>
      index === self.findIndex((t) => t.symbol === token.symbol)
  );
}

export function getAvailableOutputTokens(
  selectedFromChain: number,
  selectedToChain: number,
  selectedInputTokenSymbol: string
) {
  return enabledRoutes
    .filter(
      (route) =>
        route.fromChain === selectedFromChain &&
        route.toChain === selectedToChain &&
        route.fromTokenSymbol === selectedInputTokenSymbol
    )
    .map((route) => getToken(route.toTokenSymbol))
    .filter(
      (token, index, self) =>
        index === self.findIndex((t) => t.symbol === token.symbol)
    );
}

export function getAllChains() {
  return enabledRoutes
    .map((route) => getChainInfo(route.fromChain))
    .filter(
      (chain, index, self) =>
        index ===
        self.findIndex((fromChain) => fromChain.chainId === chain.chainId)
    )
    .sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });
}

export function getRouteFromQueryParams() {
  const params = new URLSearchParams(window.location.search);

  const fromChain = Number(params.get("from"));
  const toChain = Number(params.get("to"));
  const token = params.get("token");

  const filter = {
    fromChain: fromChain || hubPoolChainId,
    toChain: toChain || undefined,
    inputTokenSymbol: token ? token.toUpperCase() : "ETH",
  };

  let route = findNextBestRoute(["fromChain"], filter);

  if (!route) {
    route = getInitialRoute(filter);
  }

  return route;
}

export function getTokenExplorerLink(chainId: number, symbol: string) {
  const explorerBaseUrl = getChainInfo(chainId).explorerUrl;
  const token = config.getTokenInfoBySymbol(chainId, symbol);
  return `${explorerBaseUrl}/address/${token.address}`;
}

export function getTokenExplorerLinkSafe(chainId: number, symbol: string) {
  try {
    return getTokenExplorerLink(chainId, symbol);
  } catch (e) {
    if (!isProductionBuild) {
      console.warn(e);
    }
    return "";
  }
}

export function shouldUseDepositV3(selectedRoute: SelectedRoute) {
  const matchingRoutes = enabledRoutes.filter(
    (route) =>
      route.fromChain === selectedRoute.fromChain &&
      route.toChain === selectedRoute.toChain &&
      route.fromTokenSymbol === selectedRoute.fromTokenSymbol
  );
  return matchingRoutes.length > 1;
}

export function calcFeesForEstimatedTable(params: {
  capitalFee?: BigNumber;
  lpFee?: BigNumber;
  gasFee?: BigNumber;
  isSwap: boolean;
  parsedAmount?: BigNumber;
  swapQuote?: SwapQuoteApiResponse;
}) {
  if (
    !params.capitalFee ||
    !params.lpFee ||
    !params.gasFee ||
    !params.parsedAmount ||
    (params.isSwap && !params.swapQuote)
  ) {
    return;
  }

  // We display the sum of capital + lp fee as "bridge fee" in `EstimatedTable`.
  const bridgeFee = params.capitalFee.add(params.lpFee);
  const totalRelayFee = params.gasFee.add(bridgeFee);
  const swapFee =
    params.isSwap && params.swapQuote
      ? params.parsedAmount.sub(params.swapQuote.minExpectedInputTokenAmount)
      : BigNumber.from(0);
  const totalFee = totalRelayFee.add(swapFee);
  const outputAmount = params.parsedAmount.sub(totalFee);

  return {
    gasFee: params.gasFee,
    lpFee: params.lpFee,
    capitalFee: params.capitalFee,
    bridgeFee,
    totalRelayFee,
    swapFee,
    totalFee,
    outputAmount,
    swapQuote: params.swapQuote,
  };
}
