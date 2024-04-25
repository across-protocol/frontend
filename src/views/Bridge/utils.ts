import { BigNumber } from "ethers";

import {
  ChainId,
  Route,
  getChainInfo,
  getConfig,
  getToken,
  hubPoolChainId,
  isProductionBuild,
} from "utils";

type RouteFilter = Partial<{
  inputTokenSymbol: string;
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

const interchangeableTokenPairs: Record<string, string[]> = {
  USDC: ["USDbC", "USDC.e"],
  "USDC.e": ["USDC", "USDbC"],
  USDbC: ["USDC", "USDC.e"],
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
  maxDeposit?: BigNumber
) {
  if (!parsedAmountInput) {
    return {
      error: AmountInputError.INVALID,
    };
  }

  if (maxDeposit && parsedAmountInput.gt(maxDeposit)) {
    return {
      error: AmountInputError.INSUFFICIENT_LIQUIDITY,
    };
  }

  if (currentBalance && parsedAmountInput.gt(currentBalance)) {
    return {
      error: AmountInputError.INSUFFICIENT_BALANCE,
    };
  }

  if (isAmountTooLow) {
    return {
      error: AmountInputError.AMOUNT_TOO_LOW,
    };
  }

  if (parsedAmountInput.lt(0)) {
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
    }) || enabledRoutes[0]
  );
}

export function findEnabledRoute(filter: RouteFilter = {}) {
  const { inputTokenSymbol, outputTokenSymbol, fromChain, toChain } = filter;

  const route = enabledRoutes.find(
    (route) =>
      (inputTokenSymbol
        ? route.fromTokenSymbol.toUpperCase() === inputTokenSymbol.toUpperCase()
        : true) &&
      (outputTokenSymbol
        ? route.toTokenSymbol.toUpperCase() === outputTokenSymbol.toUpperCase()
        : true) &&
      (fromChain ? route.fromChain === fromChain : true) &&
      (toChain ? route.toChain === toChain : true)
  );
  return route;
}
/**
 * Returns the next best matching route based on the given priority keys and filter.
 * @param priorityFilterKeys Set of filter keys to use if no route is found based on `filter`.
 * @param filter Filter to apply for best matching route.
 */
export function findNextBestRoute(
  priorityFilterKeys: (
    | "inputTokenSymbol"
    | "outputTokenSymbol"
    | "fromChain"
    | "toChain"
  )[],
  filter: RouteFilter = {}
) {
  let route: Route | undefined;

  const equivalentInputTokenSymbols = filter.inputTokenSymbol
    ? interchangeableTokenPairs[filter.inputTokenSymbol]
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

  if (!route) {
    const allFilterKeys = ["inputTokenSymbol", "fromChain", "toChain"] as const;
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

      if (
        !route &&
        nonPrioKey === "inputTokenSymbol" &&
        equivalentInputTokenSymbols
      ) {
        for (const equivalentTokenSymbol of equivalentInputTokenSymbols) {
          route = findEnabledRoute({
            ...priorityFilter,
            inputTokenSymbol: equivalentTokenSymbol,
          });

          if (route) {
            break;
          }
        }
      }

      if (route) {
        break;
      }
    }
  }

  return route;
}

export function getAllTokens() {
  return enabledRoutes
    .map((route) => getToken(route.fromTokenSymbol))
    .filter(
      (token, index, self) =>
        index === self.findIndex((t) => t.symbol === token.symbol)
    );
}

export function getAvailableInputTokens(
  selectedFromChain: number,
  selectedToChain: number
) {
  return enabledRoutes
    .filter(
      (route) =>
        route.fromChain === selectedFromChain &&
        route.toChain === selectedToChain
    )
    .map((route) => getToken(route.fromTokenSymbol))
    .filter(
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
    symbol: token ? token.toUpperCase() : "ETH",
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
