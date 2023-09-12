import { BigNumber } from "ethers";

import {
  ChainId,
  Route,
  bridgedUSDCSymbols,
  getChainInfo,
  getConfig,
  getToken,
  hubPoolChainId,
} from "utils";

export enum AmountInputError {
  INVALID = "invalid",
  INSUFFICIENT_LIQUIDITY = "insufficientLiquidity",
  INSUFFICIENT_BALANCE = "insufficientBalance",
  AMOUNT_TOO_LOW = "amountTooLow",
}

const enabledRoutes = getConfig().getEnabledRoutes();

/**
 * Returns the token symbol to be used for the receive token. The protocol bridges
 * ETH/WETH depending on certain conditions:
 * - If the user wants to bridge ETH and destination chain is Polygon, the bridge will send WETH
 * - If the user wants to bridge ETH and the receiver is a contract, the bridge will send WETH
 * - If the user wants to bridge WETH and the receiver is an EOA, the bridge will send ETH
 * @param destinationChainId Destination chain id.
 * @param bridgeTokenSymbol Token symbol to be bridged.
 * @param isReceiverContract Whether the receiver is a contract or not.
 * @returns The token symbol to be used for the receive token.
 */
export function getReceiveTokenSymbol(
  destinationChainId: number,
  bridgeTokenSymbol: string,
  isReceiverContract: boolean
) {
  const isDestinationChainPolygon = destinationChainId === ChainId.POLYGON;

  if (
    bridgeTokenSymbol === "ETH" &&
    (isDestinationChainPolygon || isReceiverContract)
  ) {
    return "WETH";
  }

  if (
    bridgeTokenSymbol === "WETH" &&
    !isDestinationChainPolygon &&
    !isReceiverContract
  ) {
    return "ETH";
  }

  if (
    ["USDC", "USDbC"].includes(bridgeTokenSymbol) &&
    [ChainId.OPTIMISM, ChainId.ARBITRUM].includes(destinationChainId)
  ) {
    return "USDC.e";
  }

  if (
    ["USDC", "USDC.e"].includes(bridgeTokenSymbol) &&
    destinationChainId === ChainId.BASE
  ) {
    return "USDbC";
  }

  if (bridgedUSDCSymbols.includes(bridgeTokenSymbol)) {
    return "USDC";
  }

  return bridgeTokenSymbol;
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

  if (parsedAmountInput.lte(0)) {
    return {
      error: AmountInputError.INVALID,
    };
  }

  return {
    error: undefined,
  };
}

export function getInitialRoute(
  defaults: Partial<{
    symbol: string;
    fromChain: number;
    toChain: number;
  }> = {}
) {
  return (
    findEnabledRoute({
      symbol: defaults.symbol || "ETH",
      fromChain: defaults.fromChain || hubPoolChainId,
      toChain: defaults.toChain,
    }) || enabledRoutes[0]
  );
}

export function findEnabledRoute(
  filter: Partial<{
    symbol: string;
    fromChain: number;
    toChain: number;
  }> = {}
) {
  const { symbol, fromChain, toChain } = filter;

  const route = enabledRoutes.find(
    (route) =>
      (symbol ? route.fromTokenSymbol === symbol : true) &&
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
  priorityFilterKeys: ("symbol" | "fromChain" | "toChain")[],
  filter: Partial<{
    symbol: string;
    fromChain: number;
    toChain: number;
  }> = {}
) {
  let route: Route | undefined;

  const interchangeableTokenPairs: Record<string, string[]> = {
    USDC: ["USDbC", "USDC.e"],
    "USDC.e": ["USDC", "USDbC"],
    USDbC: ["USDC", "USDC.e"],
    ETH: ["WETH"],
    WETH: ["ETH"],
  };
  const equivalentTokenSymbols = filter.symbol
    ? interchangeableTokenPairs[filter.symbol]
    : undefined;

  route = findEnabledRoute(filter);

  if (!route && equivalentTokenSymbols) {
    for (const equivalentTokenSymbol of equivalentTokenSymbols) {
      route = findEnabledRoute({
        ...filter,
        symbol: equivalentTokenSymbol,
      });

      if (route) {
        break;
      }
    }
  }

  if (!route) {
    const allFilterKeys = ["symbol", "fromChain", "toChain"] as const;
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

      if (!route && nonPrioKey === "symbol" && equivalentTokenSymbols) {
        for (const equivalentTokenSymbol of equivalentTokenSymbols) {
          route = findEnabledRoute({
            ...priorityFilter,
            symbol: equivalentTokenSymbol,
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

export function getAvailableTokens(
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
