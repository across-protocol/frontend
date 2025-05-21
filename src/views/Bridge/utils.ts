import { CHAIN_IDs } from "@across-protocol/constants";
import axios from "axios";
import { externConfigs } from "constants/chains/configs";
import { BigNumber, BigNumberish } from "ethers";
import { UniversalSwapQuote } from "hooks/useUniversalSwapQuote";
import {
  Route,
  SwapRoute,
  fixedPointAdjustment,
  getChainInfo,
  getConfig,
  getToken,
  hubPoolChainId,
  isProductionBuild,
  interchangeableTokensMap,
  GetBridgeFeesResult,
  chainEndpointToId,
  parseUnits,
  isDefined,
  UniversalSwapRoute,
  TokenInfo,
  isNonEthChain,
  isStablecoin,
} from "utils";
import { SwapQuoteApiResponse } from "utils/serverless-api/prod/swap-quote";

export type SelectedRoute =
  | (Route & {
      type: "bridge";
    })
  | (SwapRoute & {
      type: "swap";
    })
  | (UniversalSwapRoute & {
      type: "universal-swap";
    });

type RouteFilter = Partial<{
  inputTokenSymbol: string;
  swapTokenSymbol: string;
  outputTokenSymbol: string;
  fromChain: number;
  toChain: number;
  externalProjectId: string;
  type: "bridge" | "swap" | "universal-swap";
}>;

export enum AmountInputError {
  INVALID = "invalid",
  PAUSED_DEPOSITS = "pausedDeposits",
  INSUFFICIENT_LIQUIDITY = "insufficientLiquidity",
  INSUFFICIENT_BALANCE = "insufficientBalance",
  AMOUNT_TOO_LOW = "amountTooLow",
  PRICE_IMPACT_TOO_HIGH = "priceImpactTooHigh",
  SWAP_QUOTE_UNAVAILABLE = "swapQuoteUnavailable",
}
const config = getConfig();
const enabledRoutes = config.getEnabledRoutes();
const swapRoutes = config.getSwapRoutes();
const universalSwapRoutes = config.getUniversalSwapRoutes();

export function areTokensInterchangeable(
  tokenSymbol1: string,
  tokenSymbol2: string
) {
  return (
    Boolean(interchangeableTokensMap[tokenSymbol1]) &&
    interchangeableTokensMap[tokenSymbol1].includes(tokenSymbol2)
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
  isReceiverContract: boolean,
  type: SelectedRoute["type"]
) {
  const isDestinationChainWethOnly = isNonEthChain(destinationChainId);

  if (
    type === "bridge" &&
    inputTokenSymbol === "ETH" &&
    (isDestinationChainWethOnly || isReceiverContract)
  ) {
    return "WETH";
  }

  if (
    type === "bridge" &&
    inputTokenSymbol === "WETH" &&
    !isDestinationChainWethOnly &&
    !isReceiverContract
  ) {
    return "ETH";
  }

  if (
    destinationChainId === CHAIN_IDs.LENS_SEPOLIA &&
    inputTokenSymbol === "GRASS"
  ) {
    return isReceiverContract ? "WGRASS" : "GRASS";
  }

  if (inputTokenSymbol === "WGRASS") {
    return "GRASS";
  }

  if (destinationChainId === CHAIN_IDs.BSC && inputTokenSymbol === "BNB") {
    return isReceiverContract ? "WBNB" : "BNB";
  }

  return outputTokenSymbol;
}

export function validateBridgeAmount(params: {
  selectedRoute: SelectedRoute;
  parsedAmountInput?: BigNumber;
  quoteFees?: GetBridgeFeesResult;
  currentBalance?: BigNumber;
  maxDeposit?: BigNumber;
  amountToBridgeAfterSwap?: BigNumber;
  universalSwapQuoteError?: Error;
}) {
  const {
    selectedRoute,
    parsedAmountInput,
    quoteFees,
    currentBalance,
    maxDeposit,
    amountToBridgeAfterSwap,
  } = params;

  if (!parsedAmountInput || !amountToBridgeAfterSwap) {
    return {
      error: AmountInputError.INVALID,
    };
  }

  if (maxDeposit && BigNumber.from(0).eq(maxDeposit)) {
    return {
      error: AmountInputError.PAUSED_DEPOSITS,
    };
  }

  if (maxDeposit && amountToBridgeAfterSwap.gt(maxDeposit)) {
    return {
      error: AmountInputError.INSUFFICIENT_LIQUIDITY,
    };
  }

  if (currentBalance && parsedAmountInput.gt(currentBalance)) {
    return {
      error: AmountInputError.INSUFFICIENT_BALANCE,
    };
  }

  if (
    quoteFees?.isAmountTooLow ||
    // HyperLiquid has a minimum deposit amount of 5 USDC
    (selectedRoute.externalProjectId === "hyperliquid" &&
      parsedAmountInput.lt(parseUnits("5.05", 6)))
  ) {
    return {
      error: AmountInputError.AMOUNT_TOO_LOW,
    };
  }

  if (parsedAmountInput.lt(0) || amountToBridgeAfterSwap.lt(0)) {
    return {
      error: AmountInputError.INVALID,
    };
  }

  if (
    params.universalSwapQuoteError &&
    axios.isAxiosError(params.universalSwapQuoteError)
  ) {
    const responseData = params.universalSwapQuoteError.response?.data as {
      code?: string;
    };
    if (responseData?.code === "SWAP_QUOTE_UNAVAILABLE") {
      return {
        error: AmountInputError.SWAP_QUOTE_UNAVAILABLE,
      };
    }
    if (responseData?.code === "AMOUNT_TOO_LOW") {
      return {
        error: AmountInputError.AMOUNT_TOO_LOW,
      };
    }
  }

  return {
    warn: undefined,
    error: undefined,
  };
}

const defaultRouteFilter = {
  fromChain: hubPoolChainId,
  inputTokenSymbol: "ETH",
};

// for certain chain routes (eg. Mainnet => Lens) we can set token IN/OUT defaults here
export function getTokenDefaultsForRoute(route: SelectedRoute): SelectedRoute {
  if (
    route.toChain === CHAIN_IDs.LENS &&
    isStablecoin(route.fromTokenSymbol) &&
    route.toTokenSymbol !== "GHO"
  ) {
    const enabledRoute = findEnabledRoute({
      fromChain: route.fromChain,
      toChain: route.toChain,
      inputTokenSymbol: route.fromTokenSymbol,
      outputTokenSymbol: "GHO",
    });
    if (enabledRoute) {
      return enabledRoute;
    }
  }

  return route;
}

const defaultFilter = {
  fromChain: hubPoolChainId,
  toChain: CHAIN_IDs.ARBITRUM,
};

export function getInitialRoute(filter: RouteFilter = {}) {
  const inputTokenSymbol =
    filter.inputTokenSymbol ??
    (isNonEthChain(filter?.fromChain) ? "WETH" : "ETH");
  const outputTokenSymbol =
    filter.outputTokenSymbol ??
    (isNonEthChain(filter?.toChain) ? "WETH" : "ETH");
  const routeFromUrl = getRouteFromUrl({
    ...filter,
    inputTokenSymbol,
    outputTokenSymbol,
    fromChain: filter.fromChain || defaultFilter.fromChain,
    toChain: filter.toChain || defaultFilter.toChain,
  });
  const routeFromFilter = findEnabledRoute({
    inputTokenSymbol,
    outputTokenSymbol,
    fromChain: filter.fromChain || defaultFilter.fromChain,
    toChain: filter.toChain || defaultFilter.toChain,
  });
  const defaultRoute = findEnabledRoute(defaultRouteFilter) ?? {
    ...enabledRoutes[0],
    type: "bridge",
  };
  return (
    routeFromUrl ?? getTokenDefaultsForRoute(routeFromFilter ?? defaultRoute)
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
    externalProjectId,
  } = filter;

  const commonRouteFilter = (route: Route | SwapRoute) =>
    (inputTokenSymbol
      ? route.fromTokenSymbol.toUpperCase() === inputTokenSymbol.toUpperCase()
      : true) &&
    (outputTokenSymbol
      ? route.toTokenSymbol.toUpperCase() === outputTokenSymbol.toUpperCase()
      : true) &&
    (fromChain ? route.fromChain === fromChain : true) &&
    (toChain ? route.toChain === toChain : true) &&
    (externalProjectId !== undefined
      ? route.externalProjectId === externalProjectId
      : true);

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
    const universalSwapRoute = universalSwapRoutes.find((route) =>
      commonRouteFilter(route)
    );

    if (universalSwapRoute) {
      return { ...universalSwapRoute, type: "universal-swap" };
    }

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

export type PriorityFilterKey =
  | "inputTokenSymbol"
  | "swapTokenSymbol"
  | "outputTokenSymbol"
  | "fromChain"
  | "toChain"
  | "externalProjectId";
/**
 * Returns the next best matching route based on the given priority keys and filter.
 * @param priorityFilterKeys Set of filter keys to use if no route is found based on `filter`.
 * @param filter Filter to apply for best matching route.
 */
export function findNextBestRoute(
  priorityFilterKeys: PriorityFilterKey[],
  filter: RouteFilter = {}
) {
  let route: SelectedRoute | undefined;

  const equivalentInputTokenSymbols = filter.inputTokenSymbol
    ? interchangeableTokensMap[filter.inputTokenSymbol]
    : undefined;
  const equivalentSwapTokenSymbols = filter.swapTokenSymbol
    ? interchangeableTokensMap[filter.swapTokenSymbol]
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
      "externalProjectId",
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
  const universalSwapTokens = universalSwapRoutes.map((route) =>
    getToken(route.fromTokenSymbol)
  );
  return [...routeTokens, ...swapTokens, ...universalSwapTokens].filter(
    (token, index, self) =>
      index === self.findIndex((t) => t.symbol === token.symbol)
  );
}

export function getAvailableInputTokens(
  selectedFromChain: number,
  selectedToChain: number,
  externalProjectId?: string
) {
  const routeTokens = enabledRoutes
    .filter(
      (route) =>
        route.fromChain === selectedFromChain &&
        route.toChain === selectedToChain &&
        route.externalProjectId === externalProjectId
    )
    .map((route) => getToken(route.fromTokenSymbol));
  const swapTokens = swapRoutes
    .filter(
      (route) =>
        route.fromChain === selectedFromChain &&
        route.toChain === selectedToChain &&
        route.externalProjectId === externalProjectId
    )
    .map((route) => getToken(route.swapTokenSymbol));
  const universalSwapTokens = universalSwapRoutes
    .filter(
      (route) =>
        route.fromChain === selectedFromChain &&
        route.toChain === selectedToChain &&
        route.externalProjectId === externalProjectId
    )
    .map((route) => getToken(route.fromTokenSymbol));
  return [...routeTokens, ...swapTokens, ...universalSwapTokens].filter(
    (token, index, self) =>
      index === self.findIndex((t) => t.symbol === token.symbol)
  );
}

export function getAvailableOutputTokens(
  selectedFromChain: number,
  selectedToChain: number,
  selectedInputTokenSymbol: string,
  externalProjectId?: string
) {
  const routeTokens = enabledRoutes
    .filter(
      (route) =>
        route.fromChain === selectedFromChain &&
        route.toChain === selectedToChain &&
        route.fromTokenSymbol === selectedInputTokenSymbol &&
        route.externalProjectId === externalProjectId
    )
    .map((route) => getToken(route.toTokenSymbol));
  const swapTokens = swapRoutes
    .filter(
      (route) =>
        route.fromChain === selectedFromChain &&
        route.toChain === selectedToChain &&
        route.swapTokenSymbol === selectedInputTokenSymbol &&
        route.externalProjectId === externalProjectId
    )
    .map((route) => getToken(route.toTokenSymbol));
  const universalSwapTokens = universalSwapRoutes
    .filter(
      (route) =>
        route.fromChain === selectedFromChain &&
        route.toChain === selectedToChain &&
        route.fromTokenSymbol === selectedInputTokenSymbol &&
        route.externalProjectId === externalProjectId
    )
    .map((route) => getToken(route.toTokenSymbol));

  return [...routeTokens, ...swapTokens, ...universalSwapTokens].filter(
    (token, index, self) =>
      index === self.findIndex((t) => t.symbol === token.symbol)
  );
}

export const ChainType = {
  FROM: "from",
  TO: "to",
  ALL: "all",
} as const;

export type ChainTypeT = (typeof ChainType)[keyof typeof ChainType];

export function getSupportedChains(chainType: ChainTypeT = ChainType.ALL) {
  let chainIds: number[] = [];

  switch (chainType) {
    case ChainType.FROM:
      chainIds = enabledRoutes.map((route) => route.fromChain);
      break;
    case ChainType.TO:
      chainIds = enabledRoutes.map((route) => route.toChain);
      break;
    case ChainType.ALL:
    default:
      chainIds = enabledRoutes.flatMap((route) => [
        route.fromChain,
        route.toChain,
      ]);
      break;
  }

  const uniqueChainIds = Array.from(new Set(chainIds));

  const uniqueChains = uniqueChainIds.flatMap((chainId) => {
    return [
      { ...getChainInfo(chainId), projectId: undefined },
      ...Object.values(externConfigs)
        .filter(
          ({ intermediaryChain, projectId }) =>
            chainType !== "from" &&
            intermediaryChain === chainId &&
            enabledRoutes.some((route) => route.externalProjectId === projectId)
        )
        .map((extern) => ({
          ...extern,
          chainId: extern.intermediaryChain,
        })),
    ];
  });

  return uniqueChains.sort((a, b) => {
    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }
    return 0;
  });
}

export function getRouteFromUrl(overrides?: RouteFilter) {
  const params = new URLSearchParams(window.location.search);

  const preferredToChain =
    chainEndpointToId[window.location.pathname.substring(1)];

  const preferredExternalProject =
    externConfigs[window.location.pathname.substring(1)];

  const fromChain =
    Number(
      params.get("from") ??
        params.get("fromChain") ??
        params.get("originChainId") ??
        // If an external project is defined, we need to ignore the overrided fromChain
        // only if the from chain is an intermediary chain of the project
        (isDefined(preferredExternalProject)
          ? preferredExternalProject.intermediaryChain === overrides?.fromChain
            ? undefined
            : overrides?.fromChain
          : overrides?.fromChain)
    ) || undefined;

  const toChain = isDefined(preferredExternalProject)
    ? preferredExternalProject.intermediaryChain
    : Number(
        preferredToChain?.chainId ??
          params.get("to") ??
          params.get("toChain") ??
          params.get("destinationChainId") ??
          overrides?.toChain
      ) || undefined;

  const externalProjectId =
    preferredExternalProject?.projectId ||
    params.get("externalProjectId") ||
    undefined;

  const inputTokenSymbol =
    params.get("inputTokenSymbol") ??
    params.get("inputToken") ??
    params.get("token") ??
    overrides?.inputTokenSymbol;

  const outputTokenSymbol =
    params.get("outputTokenSymbol") ??
    params.get("outputToken") ??
    overrides?.outputTokenSymbol ??
    undefined;

  const filter = {
    fromChain,
    toChain,
    inputTokenSymbol,
    outputTokenSymbol: outputTokenSymbol?.toUpperCase(),
    externalProjectId,
  };

  if (Object.values(filter).every((value) => !value)) {
    return undefined;
  }

  const route =
    findNextBestRoute(["fromChain", "inputTokenSymbol"], filter) ||
    findNextBestRoute(["fromChain", "swapTokenSymbol"], {
      ...filter,
      inputTokenSymbol: undefined,
      swapTokenSymbol: inputTokenSymbol,
    });

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

export function calcFeesForEstimatedTable(params: {
  capitalFee?: BigNumberish;
  lpFee?: BigNumberish;
  gasFee?: BigNumberish;
  isSwap: boolean;
  isUniversalSwap: boolean;
  parsedAmount?: BigNumberish;
  swapQuote?: SwapQuoteApiResponse;
  universalSwapQuote?: UniversalSwapQuote;
  convertInputTokenToUsd: (amount: BigNumber) => BigNumber | undefined;
  convertBridgeTokenToUsd: (amount: BigNumber) => BigNumber | undefined;
  convertOutputTokenToUsd: (amount: BigNumber) => BigNumber | undefined;
}) {
  if (
    !params.capitalFee ||
    !params.lpFee ||
    !params.gasFee ||
    !params.parsedAmount ||
    (params.isSwap && !params.swapQuote) ||
    (params.isUniversalSwap && !params.universalSwapQuote)
  ) {
    return;
  }

  const parsedAmount = BigNumber.from(params.parsedAmount || 0);
  const capitalFee = BigNumber.from(
    params.universalSwapQuote
      ? params.universalSwapQuote.steps.bridge.fees.relayerCapital.total
      : params.capitalFee || 0
  );
  const lpFee = BigNumber.from(
    params.universalSwapQuote
      ? params.universalSwapQuote.steps.bridge.fees.lp.total
      : params.lpFee || 0
  );
  const gasFee = BigNumber.from(
    params.universalSwapQuote
      ? params.universalSwapQuote.steps.bridge.fees.totalRelay.total
      : params.gasFee || 0
  );
  // We display the sum of capital + lp fee as "bridge fee" in `EstimatedTable`.
  const bridgeFee = capitalFee.add(lpFee);

  const parsedAmountUsd =
    params.convertInputTokenToUsd(parsedAmount) || BigNumber.from(0);
  const gasFeeUsd = params.convertBridgeTokenToUsd(gasFee) || BigNumber.from(0);
  const bridgeFeeUsd =
    params.convertBridgeTokenToUsd(bridgeFee) || BigNumber.from(0);
  const capitalFeeUsd =
    params.convertBridgeTokenToUsd(capitalFee) || BigNumber.from(0);
  const lpFeeUsd = params.convertBridgeTokenToUsd(lpFee) || BigNumber.from(0);
  const totalRelayFeeUsd = gasFeeUsd.add(bridgeFeeUsd);
  const swapFeeUsd =
    params.isSwap && params.swapQuote
      ? calcSwapFeeUsd(params)
      : params.isUniversalSwap && params.universalSwapQuote
        ? calcUniversalSwapFeeUsd(params)
        : BigNumber.from(0);
  const totalFeeUsd = totalRelayFeeUsd.add(swapFeeUsd);
  const outputAmountUsd = parsedAmountUsd.sub(totalFeeUsd);

  return {
    parsedAmountUsd,
    gasFeeUsd,
    bridgeFeeUsd,
    capitalFeeUsd,
    lpFeeUsd,
    totalRelayFeeUsd,
    swapFeeUsd,
    totalFeeUsd,
    outputAmountUsd,
  };
}

function calcSwapFeeUsd(params: {
  parsedAmount?: BigNumberish;
  swapQuote?: SwapQuoteApiResponse;
  convertInputTokenToUsd: (amount: BigNumber) => BigNumber | undefined;
  convertBridgeTokenToUsd: (amount: BigNumber) => BigNumber | undefined;
}) {
  if (!params.swapQuote || !params.parsedAmount) {
    return BigNumber.from(0);
  }
  const parsedInputAmountUsd =
    params.convertInputTokenToUsd(BigNumber.from(params.parsedAmount)) ||
    BigNumber.from(0);
  const swapFeeUsd = parsedInputAmountUsd.sub(
    params.convertBridgeTokenToUsd(
      BigNumber.from(params.swapQuote.minExpectedInputTokenAmount)
    ) || BigNumber.from(0)
  );
  return swapFeeUsd;
}

function calcUniversalSwapFeeUsd(params: {
  parsedAmount?: BigNumberish;
  universalSwapQuote?: UniversalSwapQuote;
  convertInputTokenToUsd: (amount: BigNumber) => BigNumber | undefined;
  convertBridgeTokenToUsd: (amount: BigNumber) => BigNumber | undefined;
  convertOutputTokenToUsd: (amount: BigNumber) => BigNumber | undefined;
}) {
  if (!params.universalSwapQuote || !params.parsedAmount) {
    return BigNumber.from(0);
  }
  const parsedAmount = BigNumber.from(params.parsedAmount || 0);
  const { steps } = params.universalSwapQuote;
  const parsedInputAmountUsd =
    params.convertInputTokenToUsd(parsedAmount) || BigNumber.from(0);
  const originSwapFeeUsd = parsedInputAmountUsd.sub(
    params.convertBridgeTokenToUsd(steps.bridge.inputAmount) ||
      BigNumber.from(0)
  );
  const destinationSwapFeeUsd = (
    params.convertBridgeTokenToUsd(steps.bridge.outputAmount) ||
    BigNumber.from(0)
  ).sub(
    params.convertOutputTokenToUsd(
      steps.destinationSwap?.outputAmount || steps.bridge.outputAmount
    ) || BigNumber.from(0)
  );
  return originSwapFeeUsd.add(destinationSwapFeeUsd);
}

export function getOutputTokenSymbol(
  inputTokenSymbol: string,
  outputTokenSymbol: string
) {
  return inputTokenSymbol === "ETH"
    ? "ETH"
    : inputTokenSymbol === "WETH"
      ? "WETH"
      : outputTokenSymbol;
}

export function calcSwapPriceImpact(
  amountInput: BigNumber,
  minExpectedInputTokenAmount: BigNumber
) {
  return amountInput.gt(0) && minExpectedInputTokenAmount.gt(0)
    ? minExpectedInputTokenAmount
        .sub(amountInput)
        .mul(fixedPointAdjustment)
        .div(amountInput)
    : BigNumber.from(0);
}

export function getTokensForFeesCalc(params: {
  swapToken?: TokenInfo;
  inputToken: TokenInfo;
  outputToken: TokenInfo;
  isUniversalSwap: boolean;
  universalSwapQuote?: UniversalSwapQuote;
  fromChainId: number;
  toChainId: number;
}) {
  const inputToken = params.swapToken || params.inputToken;
  const bridgeToken =
    params.isUniversalSwap && params.universalSwapQuote
      ? config.getTokenInfoBySymbol(
          params.fromChainId,
          params.universalSwapQuote.steps.bridge.tokenIn.symbol
        )
      : inputToken;
  const outputToken =
    params.isUniversalSwap && params.universalSwapQuote
      ? config.getTokenInfoBySymbol(
          params.toChainId,
          params.universalSwapQuote.steps.destinationSwap?.tokenOut.symbol ||
            params.universalSwapQuote.steps.bridge.tokenOut.symbol
        )
      : params.outputToken;
  return {
    inputToken,
    outputToken,
    bridgeToken,
  };
}
