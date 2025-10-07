import { TradeType } from "@uniswap/sdk-core";

import {
  getRouteByInputTokenAndDestinationChain,
  getRouteByOutputTokenAndOriginChain,
  getRoutesByChainIds,
  getTokenByAddress,
  addTimeoutToPromise,
  getLogger,
  addMarkupToAmount,
  ConvertDecimals,
  getSpokePoolAddress,
} from "../_utils";
import {
  calculateAppFee,
  getPreferredBridgeTokens,
  getQuoteFetchStrategies,
  QuoteFetchPrioritizationMode,
  QuoteFetchStrategies,
  AMOUNT_TYPE,
  CROSS_SWAP_TYPE,
  buildDestinationSwapCrossChainMessage,
  assertMinOutputAmount,
} from "./utils";
import { getMultiCallHandlerAddress } from "../_multicall-handler";
import {
  getIndirectBridgeQuoteMessage,
  getIndirectDestinationRoutes,
} from "./utils-b2bi";
import {
  InvalidParamError,
  getSwapQuoteUnavailableError,
  SwapQuoteUnavailableError,
  AcrossErrorCode,
  compactAxiosError,
} from "../_errors";

import {
  CrossSwap,
  CrossSwapQuotes,
  QuoteFetchOpts,
  QuoteFetchStrategy,
  CrossSwapQuotesRetrievalA2AResult,
  CrossSwapQuotesRetrievalA2BResult,
  CrossSwapQuotesRetrievalB2AResult,
} from "./types";
import { BridgeStrategy } from "../_bridges/types";
import { getSpokePoolPeripheryAddress } from "../_spoke-pool-periphery";
import { accountExistsOnHyperCore } from "../_hypercore";
import { CHAIN_IDs } from "../_constants";
import { BigNumber } from "ethers";

const QUOTE_BUFFER = 0.005; // 0.5%

const PROMISE_TIMEOUT_MS = 20_000;

const logger = getLogger();

export async function getCrossSwapQuotes(
  crossSwap: CrossSwap,
  strategies: QuoteFetchStrategies,
  bridge: BridgeStrategy
): Promise<CrossSwapQuotes> {
  if (crossSwap.type === AMOUNT_TYPE.EXACT_INPUT) {
    return getCrossSwapQuoteForAmountType(crossSwap, strategies, bridge, {
      [CROSS_SWAP_TYPE.BRIDGEABLE_TO_BRIDGEABLE]:
        getCrossSwapQuotesForExactInputB2B,
      [CROSS_SWAP_TYPE.BRIDGEABLE_TO_BRIDGEABLE_INDIRECT]:
        getCrossSwapQuotesForExactInputB2BI,
      [CROSS_SWAP_TYPE.BRIDGEABLE_TO_ANY]: getCrossSwapQuotesForExactInputB2A,
      [CROSS_SWAP_TYPE.ANY_TO_BRIDGEABLE]: getCrossSwapQuotesForExactInputA2B,
      [CROSS_SWAP_TYPE.ANY_TO_ANY]: getCrossSwapQuotesA2A,
    });
  }

  if (
    crossSwap.type === AMOUNT_TYPE.MIN_OUTPUT ||
    crossSwap.type === AMOUNT_TYPE.EXACT_OUTPUT
  ) {
    return getCrossSwapQuoteForAmountType(crossSwap, strategies, bridge, {
      [CROSS_SWAP_TYPE.BRIDGEABLE_TO_BRIDGEABLE]:
        getCrossSwapQuotesForOutputB2B,
      [CROSS_SWAP_TYPE.BRIDGEABLE_TO_BRIDGEABLE_INDIRECT]:
        getCrossSwapQuotesForOutputB2BI,
      [CROSS_SWAP_TYPE.BRIDGEABLE_TO_ANY]: getCrossSwapQuotesForOutputB2A,
      [CROSS_SWAP_TYPE.ANY_TO_BRIDGEABLE]: getCrossSwapQuotesForOutputA2B,
      [CROSS_SWAP_TYPE.ANY_TO_ANY]: getCrossSwapQuotesA2A,
    });
  }

  throw new InvalidParamError({
    message: `Failed to fetch swap quote: invalid amount type '${crossSwap.type}'`,
  });
}

function getCrossSwapQuoteForAmountType(
  crossSwap: CrossSwap,
  strategies: QuoteFetchStrategies,
  bridge: BridgeStrategy,
  typeToHandler: Record<
    (typeof CROSS_SWAP_TYPE)[keyof typeof CROSS_SWAP_TYPE],
    (
      crossSwap: CrossSwap,
      strategies: QuoteFetchStrategies,
      bridge: BridgeStrategy
    ) => Promise<CrossSwapQuotes>
  >
): Promise<CrossSwapQuotes> {
  const crossSwapTypes = bridge.getCrossSwapTypes({
    inputToken: crossSwap.inputToken,
    outputToken: crossSwap.outputToken,
    isInputNative: Boolean(crossSwap.isInputNative),
    isOutputNative: Boolean(crossSwap.isOutputNative),
  });

  if (crossSwapTypes.length === 0) {
    throw new InvalidParamError({
      message: `Selected bridge '${bridge.name}' can't route ${
        crossSwap.inputToken.symbol
      } (${crossSwap.inputToken.chainId}) -> ${
        crossSwap.outputToken.symbol
      } (${crossSwap.outputToken.chainId})`,
    });
  }

  const crossSwaps = crossSwapTypes.map((crossSwapType) => {
    const handler = typeToHandler[crossSwapType];
    if (!handler) {
      throw new InvalidParamError({
        message: `Failed to fetch swap quote: invalid cross swap type '${crossSwapType}'`,
      });
    }
    return handler(crossSwap, strategies, bridge);
  });

  return selectBestCrossSwapQuote(crossSwaps, crossSwap);
}

export async function getCrossSwapQuotesForExactInputB2B(
  crossSwap: CrossSwap,
  _strategies: QuoteFetchStrategies,
  bridge: BridgeStrategy
): Promise<CrossSwapQuotes> {
  const { depositEntryPoint } = _prepCrossSwapQuotesRetrievalB2B(crossSwap);

  const { bridgeQuote } = await bridge.getQuoteForExactInput({
    inputToken: crossSwap.inputToken,
    outputToken: crossSwap.outputToken,
    exactInputAmount: crossSwap.amount,
    recipient: bridge.getBridgeQuoteRecipient(crossSwap),
    message: bridge.getBridgeQuoteMessage(crossSwap),
  });

  const appFee = calculateAppFee({
    outputAmount: bridgeQuote.outputAmount,
    token: crossSwap.outputToken,
    appFeePercent: crossSwap.appFeePercent,
    appFeeRecipient: crossSwap.appFeeRecipient,
    isNative: crossSwap.isOutputNative,
  });
  bridgeQuote.message = bridge.getBridgeQuoteMessage(crossSwap, appFee);

  return {
    crossSwap,
    destinationSwapQuote: undefined,
    bridgeQuote,
    originSwapQuote: undefined,
    contracts: {
      depositEntryPoint,
    },
    appFee,
  };
}

export async function getCrossSwapQuotesForOutputB2B(
  crossSwap: CrossSwap,
  _strategies: QuoteFetchStrategies,
  bridge: BridgeStrategy
): Promise<CrossSwapQuotes> {
  const { depositEntryPoint } = _prepCrossSwapQuotesRetrievalB2B(crossSwap);

  const outputAmountWithAppFee = crossSwap.appFeePercent
    ? addMarkupToAmount(crossSwap.amount, crossSwap.appFeePercent)
    : crossSwap.amount;

  const { bridgeQuote } = await bridge.getQuoteForOutput({
    inputToken: crossSwap.inputToken,
    outputToken: crossSwap.outputToken,
    minOutputAmount: outputAmountWithAppFee,
    recipient: bridge.getBridgeQuoteRecipient(crossSwap),
    message: bridge.getBridgeQuoteMessage(crossSwap),
    forceExactOutput: crossSwap.type === AMOUNT_TYPE.EXACT_OUTPUT,
  });

  const appFee = calculateAppFee({
    outputAmount:
      crossSwap.type === AMOUNT_TYPE.MIN_OUTPUT
        ? bridgeQuote.outputAmount
        : crossSwap.amount,
    token: crossSwap.outputToken,
    appFeePercent: crossSwap.appFeePercent,
    appFeeRecipient: crossSwap.appFeeRecipient,
    isNative: crossSwap.isOutputNative,
  });
  if (
    crossSwap.type === AMOUNT_TYPE.MIN_OUTPUT ||
    (crossSwap.type === AMOUNT_TYPE.EXACT_OUTPUT && appFee.feeAmount.gt(0))
  ) {
    bridgeQuote.message = bridge.getBridgeQuoteMessage(crossSwap, appFee);
  }

  return {
    crossSwap,
    destinationSwapQuote: undefined,
    bridgeQuote,
    originSwapQuote: undefined,
    contracts: {
      depositEntryPoint,
    },
    appFee,
  };
}

export async function getCrossSwapQuotesForExactInputB2BI(
  crossSwap: CrossSwap,
  _strategies: QuoteFetchStrategies,
  bridge: BridgeStrategy
): Promise<CrossSwapQuotes> {
  const { depositEntryPoint } = _prepCrossSwapQuotesRetrievalB2B(crossSwap);

  const indirectDestinationRoutes = getIndirectDestinationRoutes({
    originChainId: crossSwap.inputToken.chainId,
    destinationChainId: crossSwap.outputToken.chainId,
    inputToken: crossSwap.inputToken.address,
    outputToken: crossSwap.outputToken.address,
  });

  if (indirectDestinationRoutes.length === 0) {
    throw new InvalidParamError({
      message: "No indirect bridge routes found to specified destination chain",
    });
  }

  const [indirectDestinationRoute] = indirectDestinationRoutes;

  // For EXACT_INPUT, we need to convert the amount to the intermediary output token decimals
  // to get the initial bridgeable output amount.
  let bridgeableOutputAmount = ConvertDecimals(
    crossSwap.inputToken.decimals,
    indirectDestinationRoute.intermediaryOutputToken.decimals
  )(crossSwap.amount);

  // If destination chain is HyperCore, we need to check if the app fee recipient and recipient
  // have initialized balances on HyperCore.
  if (crossSwap.outputToken.chainId === CHAIN_IDs.HYPERCORE) {
    const [appFeeRecipientExists, recipientExists] = await Promise.all([
      crossSwap.appFeeRecipient
        ? accountExistsOnHyperCore({
            account: crossSwap.appFeeRecipient,
          })
        : BigNumber.from(0),
      accountExistsOnHyperCore({
        account: crossSwap.recipient,
      }),
    ]);

    if (crossSwap.appFeeRecipient && !appFeeRecipientExists) {
      throw new InvalidParamError({
        message: "App fee recipient is not initialized on HyperCore",
      });
    }

    if (!recipientExists) {
      throw new InvalidParamError({
        message: "Recipient is not initialized on HyperCore",
      });
    }
  }

  // 1. We fetch a quote from inputToken.chainId -> intermediaryOutputToken.chainId
  const { bridgeQuote } = await bridge.getQuoteForExactInput({
    inputToken: crossSwap.inputToken,
    outputToken: indirectDestinationRoute.intermediaryOutputToken,
    exactInputAmount: crossSwap.amount,
    recipient: getMultiCallHandlerAddress(
      indirectDestinationRoute.intermediaryOutputToken.chainId
    ),
    message: getIndirectBridgeQuoteMessage(
      crossSwap,
      bridgeableOutputAmount,
      indirectDestinationRoute
    ),
  });

  const appFee = calculateAppFee({
    outputAmount: ConvertDecimals(
      indirectDestinationRoute.intermediaryOutputToken.decimals,
      crossSwap.outputToken.decimals
    )(bridgeQuote.outputAmount),
    token: indirectDestinationRoute.outputToken,
    appFeePercent: crossSwap.appFeePercent,
    appFeeRecipient: crossSwap.appFeeRecipient,
    isNative: crossSwap.isOutputNative,
  });
  bridgeQuote.message = getIndirectBridgeQuoteMessage(
    crossSwap,
    bridgeQuote.outputAmount,
    indirectDestinationRoute,
    appFee
  );

  return {
    crossSwap,
    destinationSwapQuote: undefined,
    bridgeQuote,
    originSwapQuote: undefined,
    contracts: {
      depositEntryPoint,
    },
    appFee,
    indirectDestinationRoute,
  };
}

export async function getCrossSwapQuotesForOutputB2BI(
  crossSwap: CrossSwap,
  _strategies: QuoteFetchStrategies,
  bridge: BridgeStrategy
): Promise<CrossSwapQuotes> {
  const { depositEntryPoint } = _prepCrossSwapQuotesRetrievalB2B(crossSwap);

  const indirectDestinationRoutes = getIndirectDestinationRoutes({
    originChainId: crossSwap.inputToken.chainId,
    destinationChainId: crossSwap.outputToken.chainId,
    inputToken: crossSwap.inputToken.address,
    outputToken: crossSwap.outputToken.address,
  });

  if (indirectDestinationRoutes.length === 0) {
    throw new InvalidParamError({
      message: "No indirect bridge routes found to specified destination chain",
    });
  }

  const [indirectDestinationRoute] = indirectDestinationRoutes;

  const outputAmountWithAppFee = crossSwap.appFeePercent
    ? addMarkupToAmount(crossSwap.amount, crossSwap.appFeePercent)
    : crossSwap.amount;

  // For output-based flows, we need to convert the specified amount to the intermediary
  // output token decimals for retrieving a bridge quote.
  const bridgeableOutputAmount = ConvertDecimals(
    indirectDestinationRoute.outputToken.decimals,
    indirectDestinationRoute.intermediaryOutputToken.decimals
  )(outputAmountWithAppFee);

  const { bridgeQuote } = await bridge.getQuoteForOutput({
    inputToken: crossSwap.inputToken,
    outputToken: indirectDestinationRoute.intermediaryOutputToken,
    minOutputAmount: bridgeableOutputAmount,
    recipient: getMultiCallHandlerAddress(
      indirectDestinationRoute.intermediaryOutputToken.chainId
    ),
    message: getIndirectBridgeQuoteMessage(
      crossSwap,
      bridgeableOutputAmount,
      indirectDestinationRoute
    ),
    forceExactOutput: crossSwap.type === AMOUNT_TYPE.EXACT_OUTPUT,
  });

  const appFee = calculateAppFee({
    outputAmount:
      crossSwap.type === AMOUNT_TYPE.MIN_OUTPUT
        ? ConvertDecimals(
            indirectDestinationRoute.intermediaryOutputToken.decimals,
            crossSwap.outputToken.decimals
          )(bridgeQuote.outputAmount)
        : crossSwap.amount,
    token: crossSwap.outputToken,
    appFeePercent: crossSwap.appFeePercent,
    appFeeRecipient: crossSwap.appFeeRecipient,
    isNative: crossSwap.isOutputNative,
  });

  bridgeQuote.message = getIndirectBridgeQuoteMessage(
    crossSwap,
    bridgeQuote.outputAmount,
    indirectDestinationRoute,
    appFee
  );

  return {
    crossSwap,
    destinationSwapQuote: undefined,
    bridgeQuote,
    originSwapQuote: undefined,
    contracts: {
      depositEntryPoint,
    },
    appFee,
    indirectDestinationRoute,
  };
}

function _prepCrossSwapQuotesRetrievalB2B(crossSwap: CrossSwap) {
  if (!crossSwap.refundOnOrigin) {
    throw new InvalidParamError({
      message:
        "Query param 'refundOnOrigin' must be 'true' for same-asset bridge swaps.",
      param: "refundOnOrigin",
    });
  }

  const spokePoolPeripheryAddress = getSpokePoolPeripheryAddress(
    crossSwap.inputToken.chainId,
    false
  );
  const spokePoolAddress = getSpokePoolAddress(
    crossSwap.inputToken.chainId,
    false
  );

  const depositEntryPoint = spokePoolPeripheryAddress
    ? ({
        name: "SpokePoolPeriphery",
        address: spokePoolPeripheryAddress,
      } as const)
    : ({
        name: crossSwap.isOriginSvm ? "SvmSpoke" : "SpokePool",
        address: spokePoolAddress,
      } as const);

  return {
    depositEntryPoint,
    originSwapChainId: crossSwap.inputToken.chainId,
    destinationChainId: crossSwap.outputToken.chainId,
  };
}

export async function getCrossSwapQuotesForExactInputB2A(
  crossSwap: CrossSwap,
  strategies: QuoteFetchStrategies,
  bridge: BridgeStrategy
): Promise<CrossSwapQuotes> {
  const results = _prepCrossSwapQuotesRetrievalB2A(crossSwap, strategies);

  const strategyFetches = results.map((result) => {
    const sources = result.destinationStrategy.getSources(
      result.destinationSwap.chainId,
      {
        excludeSources: crossSwap.excludeSources,
        includeSources: crossSwap.includeSources,
      }
    );

    const fetchFn = async () => {
      assertSources(sources);
      // 1. Get destination swap quote for bridgeable output token -> any token
      const indicativeDestinationSwapQuote =
        await result.destinationStrategy.fetchFn(
          {
            ...result.destinationSwap,
            amount: ConvertDecimals(
              crossSwap.inputToken.decimals,
              result.destinationSwap.tokenIn.decimals
            )(crossSwap.amount).toString(),
          },
          TradeType.EXACT_INPUT,
          { sources }
        );
      return {
        result,
        sources,
        indicativeDestinationSwapQuote,
      };
    };

    return fetchFn;
  });

  // Run fetchFn for all strategy combinations and choose the fastest response
  const prioritizedStrategy = await executeStrategies(
    strategyFetches,
    strategies.prioritizationMode
  );

  const {
    destinationSwap,
    originRouter,
    destinationRouter,
    depositEntryPoint,
    bridgeableOutputToken,
    destinationSwapChainId,
    destinationStrategy,
  } = prioritizedStrategy.result;

  // 2. Get bridge quote for bridgeable input token -> any token with exact input amount.
  const { bridgeQuote } = await bridge.getQuoteForExactInput({
    inputToken: crossSwap.inputToken,
    outputToken: bridgeableOutputToken,
    exactInputAmount: crossSwap.amount,
    recipient: getMultiCallHandlerAddress(destinationSwapChainId),
    message: buildDestinationSwapCrossChainMessage({
      crossSwap,
      destinationSwapQuote: prioritizedStrategy.indicativeDestinationSwapQuote,
      bridgeableOutputToken,
      router: destinationRouter,
    }),
  });

  // 3. Get destination swap quote with correct amount
  const destinationSwapQuote = await destinationStrategy.fetchFn(
    {
      ...destinationSwap,
      amount: bridgeQuote.outputAmount.toString(),
    },
    TradeType.EXACT_INPUT,
    { sources: prioritizedStrategy.sources }
  );

  // 4. Build bridge quote message for destination swap
  const appFee = calculateAppFee({
    outputAmount: destinationSwapQuote.minAmountOut,
    token: crossSwap.outputToken,
    appFeePercent: crossSwap.appFeePercent,
    appFeeRecipient: crossSwap.appFeeRecipient,
    isNative: crossSwap.isOutputNative,
  });
  bridgeQuote.message = buildDestinationSwapCrossChainMessage({
    crossSwap,
    destinationSwapQuote,
    bridgeableOutputToken,
    router: destinationRouter,
    appFee,
  });

  return {
    crossSwap,
    bridgeQuote,
    destinationSwapQuote,
    originSwapQuote: undefined,
    contracts: {
      originRouter,
      destinationRouter,
      depositEntryPoint,
    },
    appFee,
  };
}

export async function getCrossSwapQuotesForOutputB2A(
  crossSwap: CrossSwap,
  strategies: QuoteFetchStrategies,
  bridge: BridgeStrategy
): Promise<CrossSwapQuotes> {
  // Add app fee percentage markup to cross swap amount
  const crossSwapWithAppFee = {
    ...crossSwap,
    amount: crossSwap.appFeePercent
      ? addMarkupToAmount(crossSwap.amount, crossSwap.appFeePercent)
      : crossSwap.amount,
  };
  const results = _prepCrossSwapQuotesRetrievalB2A(
    crossSwapWithAppFee,
    strategies
  );

  const strategyFetches = results.map((result) => {
    const sources = result.destinationStrategy.getSources(
      result.destinationSwap.chainId,
      {
        excludeSources: crossSwapWithAppFee.excludeSources,
        includeSources: crossSwapWithAppFee.includeSources,
      }
    );

    const fetchFn = async () => {
      assertSources(sources);
      // 1. Get destination swap quote for bridgeable output token -> any token
      const destinationSwapQuote = await result.destinationStrategy.fetchFn(
        {
          ...result.destinationSwap,
          amount: crossSwapWithAppFee.amount.toString(),
        },
        TradeType.EXACT_OUTPUT,
        { sources }
      );
      return {
        result,
        destinationSwapQuote,
        sources,
      };
    };

    return fetchFn;
  });

  // Run fetchFn for all strategy combinations and choose the fastest response
  const prioritizedStrategy = await executeStrategies(
    strategyFetches,
    strategies.prioritizationMode
  );
  assertMinOutputAmount(
    prioritizedStrategy.destinationSwapQuote.minAmountOut,
    crossSwapWithAppFee.amount,
    {
      actualAmountOut: "destinationSwapQuote.minAmountOut",
      expectedMinAmountOut: "crossSwap.amount",
    }
  );

  const appFee = calculateAppFee({
    outputAmount:
      crossSwapWithAppFee.type === AMOUNT_TYPE.EXACT_OUTPUT
        ? crossSwap.amount
        : prioritizedStrategy.destinationSwapQuote.minAmountOut,
    token: crossSwapWithAppFee.outputToken,
    appFeePercent: crossSwapWithAppFee.appFeePercent,
    appFeeRecipient: crossSwapWithAppFee.appFeeRecipient,
    isNative: crossSwapWithAppFee.isOutputNative,
  });

  const {
    originRouter,
    destinationRouter,
    depositEntryPoint,
    bridgeableOutputToken,
    destinationSwapChainId,
  } = prioritizedStrategy.result;

  // 2, Fetch  bridge quote for bridgeable input token -> bridgeable output token based on
  //    destination swap quote.
  const { bridgeQuote } = await bridge.getQuoteForOutput({
    inputToken: crossSwapWithAppFee.inputToken,
    outputToken: bridgeableOutputToken,
    minOutputAmount: prioritizedStrategy.destinationSwapQuote.maximumAmountIn,
    recipient: getMultiCallHandlerAddress(destinationSwapChainId),
    message: buildDestinationSwapCrossChainMessage({
      crossSwap: crossSwapWithAppFee,
      destinationSwapQuote: prioritizedStrategy.destinationSwapQuote,
      bridgeableOutputToken,
      router: destinationRouter,
      appFee,
    }),
    forceExactOutput: true,
  });
  assertMinOutputAmount(
    bridgeQuote.outputAmount,
    prioritizedStrategy.destinationSwapQuote.maximumAmountIn,
    {
      actualAmountOut: "bridgeQuote.outputAmount",
      expectedMinAmountOut:
        "prioritizedStrategy.destinationSwapQuote.maximumAmountIn",
    }
  );

  return {
    crossSwap: crossSwapWithAppFee,
    bridgeQuote,
    destinationSwapQuote: prioritizedStrategy.destinationSwapQuote,
    originSwapQuote: undefined,
    contracts: {
      originRouter,
      destinationRouter,
      depositEntryPoint,
    },
    appFee,
  };
}

function _prepCrossSwapQuotesRetrievalB2A(
  crossSwap: CrossSwap,
  strategies: QuoteFetchStrategies
): CrossSwapQuotesRetrievalB2AResult[] {
  const originStrategies = getQuoteFetchStrategies(
    crossSwap.inputToken.chainId,
    crossSwap.inputToken.symbol,
    crossSwap.inputToken.symbol,
    strategies
  );
  // Use the first origin strategy that is supported for the input token since we don't need
  // to fetch multiple origin quotes for B2A swaps.
  const originStrategy = originStrategies.find((originStrategy) => {
    try {
      originStrategy.getRouter(crossSwap.inputToken.chainId);
      return true;
    } catch (error) {
      return false;
    }
  });
  if (!originStrategy) {
    throw new InvalidParamError({
      message: `Failed to fetch swap quote: no origin strategy found for ${crossSwap.inputToken.symbol}`,
    });
  }

  const originSwapChainId = crossSwap.inputToken.chainId;
  const destinationSwapChainId = crossSwap.outputToken.chainId;
  const bridgeRoute = getRouteByInputTokenAndDestinationChain(
    crossSwap.inputToken.address,
    destinationSwapChainId
  );

  if (!bridgeRoute) {
    throw new InvalidParamError({
      message:
        `Failed to fetch swap quote: ` +
        `No bridge route found for input token ${crossSwap.inputToken.symbol} ` +
        `${crossSwap.inputToken.chainId} -> ${destinationSwapChainId}`,
    });
  }

  const _bridgeableOutputToken = getTokenByAddress(
    bridgeRoute.toTokenAddress,
    bridgeRoute.toChain
  );

  if (!_bridgeableOutputToken) {
    throw new InvalidParamError({
      message:
        `Failed to fetch swap quote: ` +
        `No bridgeable output token found for ${bridgeRoute.toTokenAddress} ` +
        `on chain ${bridgeRoute.toChain}`,
    });
  }

  const bridgeableOutputToken = {
    address: bridgeRoute.toTokenAddress,
    decimals: _bridgeableOutputToken.decimals,
    symbol: _bridgeableOutputToken.symbol,
    chainId: destinationSwapChainId,
  };

  const destinationSwap = {
    chainId: destinationSwapChainId,
    tokenIn: bridgeableOutputToken,
    tokenOut: crossSwap.outputToken,
    recipient: getMultiCallHandlerAddress(destinationSwapChainId),
    slippageTolerance: crossSwap.slippageTolerance,
    type: crossSwap.type,
  };
  const destinationStrategies = getQuoteFetchStrategies(
    destinationSwap.chainId,
    destinationSwap.tokenIn.symbol,
    destinationSwap.tokenOut.symbol,
    strategies
  );

  return destinationStrategies.flatMap((destinationStrategy) => {
    try {
      const originRouter = originStrategy.getRouter(originSwapChainId);
      const destinationRouter = destinationStrategy.getRouter(
        destinationSwapChainId
      );
      const depositEntryPoint =
        originStrategy.getOriginEntryPoints(originSwapChainId).deposit;

      return {
        destinationSwap,
        originRouter,
        destinationRouter,
        depositEntryPoint,
        bridgeableOutputToken,
        destinationSwapChainId,
        destinationStrategy,
        originStrategy,
      };
    } catch (error) {
      logger.debug({
        at: "_prepCrossSwapQuotesRetrievalB2A",
        message: "Could not map destination strategy",
        error,
      });
      return [];
    }
  });
}

export async function getCrossSwapQuotesForExactInputA2B(
  crossSwap: CrossSwap,
  strategies: QuoteFetchStrategies,
  bridge: BridgeStrategy
) {
  const results = _prepCrossSwapQuotesRetrievalA2B(crossSwap, strategies);

  const strategyFetches = results.map((result) => {
    const sources = result.originStrategy.getSources(
      result.originSwap.chainId,
      {
        excludeSources: crossSwap.excludeSources,
        includeSources: crossSwap.includeSources,
      }
    );

    const fetchFn = async () => {
      assertSources(sources);
      // 1. Get origin swap quote for any input token -> bridgeable output token
      const originSwapQuote = await result.originStrategy.fetchFn(
        {
          ...result.originSwap,
          amount: crossSwap.amount.toString(),
        },
        TradeType.EXACT_INPUT,
        { sources }
      );
      return {
        result,
        originSwapQuote,
      };
    };

    return fetchFn;
  });

  // Run fetchFn for all strategy combinations and choose the fastest response
  const prioritizedStrategy = await executeStrategies(
    strategyFetches,
    strategies.prioritizationMode
  );

  const {
    originStrategy,
    originSwapChainId,
    bridgeableInputToken,
    originSwapEntryPoint,
  } = prioritizedStrategy.result;

  // 2. Get bridge quote for bridgeable input token -> bridgeable output token
  const { bridgeQuote } = await bridge.getQuoteForExactInput({
    inputToken: bridgeableInputToken,
    outputToken: crossSwap.outputToken,
    exactInputAmount: prioritizedStrategy.originSwapQuote.minAmountOut,
    recipient: bridge.getBridgeQuoteRecipient(crossSwap),
    message: bridge.getBridgeQuoteMessage(crossSwap),
  });

  const appFee = calculateAppFee({
    outputAmount: bridgeQuote.outputAmount,
    token: crossSwap.outputToken,
    appFeePercent: crossSwap.appFeePercent,
    appFeeRecipient: crossSwap.appFeeRecipient,
    isNative: crossSwap.isOutputNative,
  });
  bridgeQuote.message = bridge.getBridgeQuoteMessage(crossSwap, appFee);

  return {
    crossSwap,
    bridgeQuote,
    destinationSwapQuote: undefined,
    originSwapQuote: prioritizedStrategy.originSwapQuote,
    contracts: {
      originSwapEntryPoint,
      depositEntryPoint:
        originStrategy.getOriginEntryPoints(originSwapChainId).deposit,
      originRouter: originStrategy.getRouter(originSwapChainId),
    },
    appFee,
  };
}

export async function getCrossSwapQuotesForOutputA2B(
  crossSwap: CrossSwap,
  strategies: QuoteFetchStrategies,
  bridge: BridgeStrategy
) {
  const crossSwapWithAppFee = {
    ...crossSwap,
    amount: crossSwap.appFeePercent
      ? addMarkupToAmount(crossSwap.amount, crossSwap.appFeePercent)
      : crossSwap.amount,
  };
  const results = _prepCrossSwapQuotesRetrievalA2B(
    crossSwapWithAppFee,
    strategies
  );

  if (results.length === 0) {
    throw new InvalidParamError({
      message: `Failed to fetch swap quote: no strategies available for ${
        crossSwapWithAppFee.inputToken.symbol
      } -> ${crossSwapWithAppFee.outputToken.symbol} on chain ${crossSwapWithAppFee.inputToken.chainId}`,
    });
  }

  const { originSwapChainId, bridgeableInputToken } = results[0];

  // 1. Get bridge quote for bridgeable input token -> bridgeable output token
  const { bridgeQuote } = await bridge.getQuoteForOutput({
    inputToken: bridgeableInputToken,
    outputToken: crossSwapWithAppFee.outputToken,
    minOutputAmount: crossSwapWithAppFee.amount,
    recipient: bridge.getBridgeQuoteRecipient(crossSwapWithAppFee),
    message: bridge.getBridgeQuoteMessage(crossSwapWithAppFee),
    forceExactOutput: crossSwapWithAppFee.type === AMOUNT_TYPE.EXACT_OUTPUT,
  });

  const strategyFetches = results.map((result) => {
    const sources = result.originStrategy.getSources(
      result.originSwap.chainId,
      {
        excludeSources: crossSwapWithAppFee.excludeSources,
        includeSources: crossSwapWithAppFee.includeSources,
      }
    );

    const fetchFn = async () => {
      assertSources(sources);
      const originSwapQuote = await result.originStrategy.fetchFn(
        {
          ...result.originSwap,
          depositor: crossSwapWithAppFee.depositor,
          amount: addMarkupToAmount(
            bridgeQuote.inputAmount,
            QUOTE_BUFFER
          ).toString(),
        },
        TradeType.EXACT_OUTPUT,
        { sources }
      );

      return {
        result,
        originSwapQuote,
        sources,
      };
    };

    return fetchFn;
  });

  // Run fetchFn for all strategy combinations and choose the fastest response
  const prioritizedStrategy = await executeStrategies(
    strategyFetches,
    strategies.prioritizationMode
  );

  // Update bridge quote message
  const appFee = calculateAppFee({
    outputAmount:
      crossSwapWithAppFee.type === AMOUNT_TYPE.EXACT_OUTPUT
        ? crossSwap.amount
        : bridgeQuote.outputAmount,
    token: crossSwapWithAppFee.outputToken,
    appFeePercent: crossSwapWithAppFee.appFeePercent,
    appFeeRecipient: crossSwapWithAppFee.appFeeRecipient,
    isNative: crossSwapWithAppFee.isOutputNative,
  });

  if (appFee.feeAmount.gt(0)) {
    bridgeQuote.message = bridge.getBridgeQuoteMessage(
      crossSwapWithAppFee,
      appFee
    );
  }

  return {
    crossSwap: crossSwapWithAppFee,
    bridgeQuote,
    destinationSwapQuote: undefined,
    originSwapQuote: prioritizedStrategy.originSwapQuote,
    contracts: {
      originSwapEntryPoint: prioritizedStrategy.result.originSwapEntryPoint,
      depositEntryPoint:
        prioritizedStrategy.result.originStrategy.getOriginEntryPoints(
          originSwapChainId
        ).deposit,
      originRouter:
        prioritizedStrategy.result.originStrategy.getRouter(originSwapChainId),
    },
    appFee,
  };
}

function _prepCrossSwapQuotesRetrievalA2B(
  crossSwap: CrossSwap,
  strategies: QuoteFetchStrategies
): CrossSwapQuotesRetrievalA2BResult[] {
  const originSwapChainId = crossSwap.inputToken.chainId;
  const destinationChainId = crossSwap.outputToken.chainId;
  const bridgeRoute = getRouteByOutputTokenAndOriginChain(
    crossSwap.outputToken.address,
    originSwapChainId
  );

  if (!bridgeRoute) {
    throw new Error(
      `No bridge route found for output token ${crossSwap.outputToken.symbol} ` +
        `${originSwapChainId} -> ${crossSwap.outputToken.chainId}`
    );
  }

  const _bridgeableInputToken = getTokenByAddress(
    bridgeRoute.fromTokenAddress,
    bridgeRoute.fromChain
  );

  if (!_bridgeableInputToken) {
    throw new Error(
      `No bridgeable input token found for ${bridgeRoute.toTokenAddress} on chain ${bridgeRoute.toChain}`
    );
  }

  const bridgeableInputToken = {
    address: bridgeRoute.fromTokenAddress,
    decimals: _bridgeableInputToken.decimals,
    symbol: _bridgeableInputToken.symbol,
    chainId: bridgeRoute.fromChain,
  };

  const originStrategies = getQuoteFetchStrategies(
    originSwapChainId,
    crossSwap.inputToken.symbol,
    bridgeableInputToken.symbol,
    strategies
  );

  // Return a list of results for each origin strategy
  return originStrategies.flatMap((originStrategy) => {
    try {
      const { swapAndBridge, originSwapInitialRecipient } =
        originStrategy.getOriginEntryPoints(originSwapChainId);
      const originSwap = {
        chainId: originSwapChainId,
        tokenIn: crossSwap.inputToken,
        tokenOut: bridgeableInputToken,
        recipient: crossSwap.isOriginSvm
          ? crossSwap.depositor
          : originSwapInitialRecipient.address,
        slippageTolerance: crossSwap.slippageTolerance,
        type: crossSwap.type,
      };

      return {
        originSwap,
        originStrategy,
        originSwapChainId,
        destinationChainId,
        bridgeableInputToken,
        originSwapEntryPoint: swapAndBridge,
      };
    } catch (error) {
      logger.debug({
        at: "_prepCrossSwapQuotesRetrievalA2B",
        message: "Could not map origin strategy",
        error,
      });
      return [];
    }
  });
}

export async function getCrossSwapQuotesA2A(
  crossSwap: CrossSwap,
  strategies: QuoteFetchStrategies,
  bridge: BridgeStrategy
) {
  const preferredBridgeTokens = getPreferredBridgeTokens(
    crossSwap.inputToken.chainId,
    crossSwap.outputToken.chainId
  );
  const bridgeRoutesToCompareChunkSize = 1;
  const fetchQuoteForRoute =
    crossSwap.type === AMOUNT_TYPE.EXACT_INPUT
      ? getCrossSwapQuotesForExactInputByRouteA2A
      : getCrossSwapQuotesForOutputByRouteA2A;

  const originSwapChainId = crossSwap.inputToken.chainId;
  const destinationSwapChainId = crossSwap.outputToken.chainId;
  const allBridgeRoutes = getRoutesByChainIds(
    originSwapChainId,
    destinationSwapChainId
  );

  if (allBridgeRoutes.length === 0) {
    throw new InvalidParamError({
      message:
        `Failed to fetch swap quote: ` +
        `No bridge routes found for ${originSwapChainId} -> ${destinationSwapChainId}`,
    });
  }

  const preferredBridgeRoutes = allBridgeRoutes
    .filter(({ toTokenSymbol }) =>
      preferredBridgeTokens.includes(toTokenSymbol)
    )
    .sort((a, b) => {
      const aIndex = preferredBridgeTokens.indexOf(a.toTokenSymbol);
      const bIndex = preferredBridgeTokens.indexOf(b.toTokenSymbol);
      return aIndex - bIndex;
    });
  const bridgeRoutes =
    preferredBridgeRoutes.length > 0 ? preferredBridgeRoutes : allBridgeRoutes;

  let chunkStart = 0;
  const allCrossSwapQuotesFailures: Error[] = [];
  while (chunkStart < bridgeRoutes.length) {
    const bridgeRoutesToCompare = bridgeRoutes.slice(
      chunkStart,
      chunkStart + bridgeRoutesToCompareChunkSize
    );

    if (bridgeRoutesToCompare.length === 0) {
      throw new InvalidParamError({
        message:
          `Failed to fetch swap quote: ` +
          `No bridge routes to compare for ${originSwapChainId} -> ${destinationSwapChainId}`,
      });
    }

    const crossSwapQuotesResults = await Promise.allSettled(
      bridgeRoutesToCompare.map((bridgeRoute) =>
        fetchQuoteForRoute(crossSwap, bridgeRoute, strategies, bridge)
      )
    );

    const crossSwapQuotesFailures = crossSwapQuotesResults
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason);
    allCrossSwapQuotesFailures.push(...crossSwapQuotesFailures);

    const crossSwapQuotes = crossSwapQuotesResults
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);

    if (crossSwapQuotes.length === 0) {
      chunkStart += bridgeRoutesToCompareChunkSize;
      continue;
    }

    // Compare quotes by lowest input amount or max. output amount
    const bestCrossSwapQuote = crossSwapQuotes.reduce((prev, curr) =>
      crossSwap.type === AMOUNT_TYPE.EXACT_INPUT
        ? prev.destinationSwapQuote!.minAmountOut.lt(
            curr.destinationSwapQuote!.minAmountOut
          )
          ? curr
          : prev
        : prev.originSwapQuote!.maximumAmountIn.lt(
              curr.originSwapQuote!.maximumAmountIn
            )
          ? prev
          : curr
    );
    return bestCrossSwapQuote;
  }

  logger.debug({
    at: "getCrossSwapQuotesA2A",
    message: "All bridge routes and providers failed",
    failedReasons: allCrossSwapQuotesFailures.map((failure) =>
      compactAxiosError(failure)
    ),
  });
  throw getSwapQuoteUnavailableError(allCrossSwapQuotesFailures);
}

export async function getCrossSwapQuotesForExactInputByRouteA2A(
  crossSwap: CrossSwap,
  bridgeRoute: {
    fromTokenAddress: string;
    fromChain: number;
    toTokenAddress: string;
    toChain: number;
  },
  strategies: QuoteFetchStrategies,
  bridge: BridgeStrategy
): Promise<CrossSwapQuotes> {
  const results = _prepCrossSwapQuotesRetrievalA2A({
    crossSwap,
    bridgeRoute,
    strategies,
    strategiesToUseForComparison: "origin",
    includeSources: crossSwap.includeSources,
  });

  const originStrategyFetches = results.map((result) => {
    const originSources = result.originStrategy.getSources(
      result.originSwap.chainId,
      {
        excludeSources: crossSwap.excludeSources,
        includeSources: crossSwap.includeSources,
      }
    );
    const destinationSources = result.destinationStrategy.getSources(
      result.destinationSwap.chainId,
      {
        excludeSources: crossSwap.excludeSources,
        includeSources: crossSwap.includeSources,
      }
    );
    const mergedSources = originSources
      ? {
          ...originSources,
          sourcesKeys: [
            ...(originSources?.sourcesKeys ?? []),
            ...(destinationSources?.sourcesKeys ?? []),
          ],
        }
      : undefined;

    const fetchFn = async () => {
      assertSources(mergedSources);

      if (crossSwap.strictTradeType) {
        result.destinationStrategy.assertSellEntireBalanceSupported();
      }

      // 1. Get origin swap quote for any input token -> bridgeable input token
      const originSwapQuote = await result.originStrategy.fetchFn(
        {
          ...result.originSwap,
          depositor: crossSwap.depositor,
          amount: crossSwap.amount.toString(),
        },
        TradeType.EXACT_INPUT,
        { sources: originSources }
      );

      // 2. Get INDICATIVE destination swap quote for bridgeable output token -> any token
      //    with exact input amount set to `originSwapQuote.minAmountOut`.
      const indicativeDestinationSwapQuote =
        await result.destinationStrategy.fetchFn(
          {
            ...result.destinationSwap,
            amount: originSwapQuote.minAmountOut.toString(),
          },
          TradeType.EXACT_INPUT,
          { sources: destinationSources }
        );
      return {
        result,
        originSwapQuote,
        originSources,
        indicativeDestinationSwapQuote,
        destinationSources,
      };
    };

    return fetchFn;
  });

  // Run fetchFn for all origin strategies and choose the fastest response
  const prioritizedOriginStrategy = await executeStrategies(
    originStrategyFetches,
    strategies.prioritizationMode
  );

  const {
    destinationSwap,
    originRouter,
    destinationRouter,
    depositEntryPoint,
    bridgeableInputToken,
    bridgeableOutputToken,
    destinationSwapChainId,
    originSwapEntryPoint,
    destinationStrategy,
  } = prioritizedOriginStrategy.result;

  // 3. Get bridge quote for bridgeable input token -> bridgeable output token
  const { bridgeQuote } = await bridge.getQuoteForExactInput({
    inputToken: bridgeableInputToken,
    outputToken: bridgeableOutputToken,
    exactInputAmount: prioritizedOriginStrategy.originSwapQuote.minAmountOut,
    recipient: getMultiCallHandlerAddress(destinationSwapChainId),
    message: buildDestinationSwapCrossChainMessage({
      crossSwap,
      destinationSwapQuote:
        prioritizedOriginStrategy.indicativeDestinationSwapQuote,
      bridgeableOutputToken,
      router: destinationRouter,
    }),
  });

  // 4. Get destination swap quote for bridgeable output token -> any token
  const destinationSwapQuote = await destinationStrategy.fetchFn(
    {
      ...destinationSwap,
      amount: bridgeQuote.outputAmount.toString(),
    },
    TradeType.EXACT_INPUT,
    {
      sources: prioritizedOriginStrategy.destinationSources,
      sellEntireBalance: true,
      // `sellEntireBalance` is not supported by all swap strategies. We throw an error
      // if we want to be strict about the provided `tradeType`. The user can override
      // this behavior by setting `strictTradeType=false` in the query params.
      throwIfSellEntireBalanceUnsupported: crossSwap.strictTradeType,
      quoteBuffer: QUOTE_BUFFER,
    }
  );

  // 5. Build bridge quote message for destination swap
  const appFee = calculateAppFee({
    outputAmount: destinationSwapQuote.minAmountOut,
    token: crossSwap.outputToken,
    appFeePercent: crossSwap.appFeePercent,
    appFeeRecipient: crossSwap.appFeeRecipient,
    isNative: crossSwap.isOutputNative,
  });
  bridgeQuote.message = buildDestinationSwapCrossChainMessage({
    crossSwap,
    destinationSwapQuote,
    bridgeableOutputToken,
    router: destinationRouter,
    appFee,
  });

  return {
    crossSwap,
    destinationSwapQuote,
    bridgeQuote,
    originSwapQuote: prioritizedOriginStrategy.originSwapQuote,
    contracts: {
      originSwapEntryPoint,
      depositEntryPoint,
      originRouter: originRouter,
      destinationRouter: destinationRouter,
    },
    appFee,
  };
}

export async function getCrossSwapQuotesForOutputByRouteA2A(
  crossSwap: CrossSwap,
  bridgeRoute: {
    fromTokenAddress: string;
    fromChain: number;
    toTokenAddress: string;
    toChain: number;
  },
  strategies: QuoteFetchStrategies,
  bridge: BridgeStrategy
): Promise<CrossSwapQuotes> {
  // Add app fee percentage markup to cross swap amount
  const crossSwapWithAppFee = {
    ...crossSwap,
    amount: crossSwap.appFeePercent
      ? addMarkupToAmount(crossSwap.amount, crossSwap.appFeePercent)
      : crossSwap.amount,
  };
  const results = _prepCrossSwapQuotesRetrievalA2A({
    crossSwap: crossSwapWithAppFee,
    bridgeRoute,
    strategies,
    strategiesToUseForComparison: "destination",
    includeSources: crossSwapWithAppFee.includeSources,
  });

  const destinationStrategyFetches = results.map((result) => {
    const originSources = result.originStrategy.getSources(
      result.originSwap.chainId,
      {
        excludeSources: crossSwapWithAppFee.excludeSources,
        includeSources: crossSwapWithAppFee.includeSources,
      }
    );
    const destinationSources = result.destinationStrategy.getSources(
      result.destinationSwap.chainId,
      {
        excludeSources: crossSwapWithAppFee.excludeSources,
        includeSources: crossSwapWithAppFee.includeSources,
      }
    );
    const mergedSources = originSources
      ? {
          ...originSources,
          sourcesKeys: [
            ...(originSources?.sourcesKeys ?? []),
            ...(destinationSources?.sourcesKeys ?? []),
          ],
        }
      : undefined;

    const fetchFn = async () => {
      assertSources(mergedSources);

      if (crossSwapWithAppFee.strictTradeType) {
        result.destinationStrategy.assertSellEntireBalanceSupported();
      }

      // 1. Get destination swap quote for bridgeable output token -> any token
      const destinationSwapQuote = await result.destinationStrategy.fetchFn(
        {
          ...result.destinationSwap,
          amount: crossSwapWithAppFee.amount.toString(),
        },
        TradeType.EXACT_OUTPUT,
        {
          sources: destinationSources,
        }
      );
      assertMinOutputAmount(
        destinationSwapQuote.minAmountOut,
        crossSwapWithAppFee.amount,
        {
          actualAmountOut: "destinationSwapQuote.minAmountOut",
          expectedMinAmountOut: "crossSwapWithAppFee.amount",
        }
      );

      return {
        result,
        destinationSwapQuote,
        destinationSources,
      };
    };

    return fetchFn;
  });

  // Run destination swap quote fetches for all strategy combinations and choose the fastest
  const prioritizedDestinationStrategy = await executeStrategies(
    destinationStrategyFetches,
    strategies.prioritizationMode
  );
  const { result, destinationSwapQuote, destinationSources } =
    prioritizedDestinationStrategy;
  const {
    originRouter,
    destinationRouter,
    depositEntryPoint,
    bridgeableInputToken,
    bridgeableOutputToken,
    destinationSwapChainId,
    originSwapEntryPoint,
    originSwap,
    originStrategy,
    originSwapChainId,
    destinationSwap,
    destinationStrategy,
  } = result;

  // 2. Get bridge quote for bridgeable input token -> bridgeable output token
  const { bridgeQuote } = await bridge.getQuoteForOutput({
    inputToken: bridgeableInputToken,
    outputToken: bridgeableOutputToken,
    minOutputAmount: destinationSwapQuote.maximumAmountIn,
    recipient: getMultiCallHandlerAddress(destinationSwapChainId),
    message: buildDestinationSwapCrossChainMessage({
      crossSwap: crossSwapWithAppFee,
      destinationSwapQuote,
      bridgeableOutputToken,
      router: destinationRouter,
    }),
  });
  assertMinOutputAmount(
    bridgeQuote.outputAmount,
    destinationSwapQuote.maximumAmountIn,
    {
      actualAmountOut: "bridgeQuote.outputAmount",
      expectedMinAmountOut: "destinationSwapQuote.maximumAmountIn",
    }
  );

  const originSources = originStrategy.getSources(originSwapChainId, {
    excludeSources: crossSwapWithAppFee.excludeSources,
    includeSources: crossSwapWithAppFee.includeSources,
  });

  const [finalDestinationSwapQuote, originSwapQuote] = await Promise.all([
    // 3.1. Get destination swap quote for bridgeable output token -> any token
    executeStrategies(
      [
        async () => {
          return destinationStrategy.fetchFn(
            {
              ...destinationSwap,
              amount: bridgeQuote.outputAmount.toString(),
            },
            TradeType.EXACT_INPUT,
            {
              sources: destinationSources,
              sellEntireBalance: true,
              // `sellEntireBalance` is not supported by all swap strategies. We throw an error
              // if we want to be strict about the provided `tradeType`. The user can override
              // this behavior by setting `strictTradeType=false` in the query params.
              throwIfSellEntireBalanceUnsupported:
                crossSwapWithAppFee.strictTradeType,
              quoteBuffer: QUOTE_BUFFER,
            }
          );
        },
      ],
      strategies.prioritizationMode
    ),
    // 3.2. Get origin swap quote for any input token -> bridgeable input token
    executeStrategies(
      [
        async () => {
          assertSources(originSources);
          return originStrategy.fetchFn(
            {
              ...originSwap,
              depositor: crossSwapWithAppFee.depositor,
              amount: addMarkupToAmount(
                bridgeQuote.inputAmount,
                QUOTE_BUFFER
              ).toString(),
            },
            TradeType.EXACT_OUTPUT,
            {
              sources: originSources,
            }
          );
        },
      ],
      strategies.prioritizationMode
    ),
  ]);
  const appFee = calculateAppFee({
    outputAmount:
      crossSwapWithAppFee.type === AMOUNT_TYPE.EXACT_OUTPUT
        ? crossSwap.amount
        : finalDestinationSwapQuote.minAmountOut,
    token: crossSwapWithAppFee.outputToken,
    appFeePercent: crossSwapWithAppFee.appFeePercent,
    appFeeRecipient: crossSwapWithAppFee.appFeeRecipient,
    isNative: crossSwapWithAppFee.isOutputNative,
  });
  bridgeQuote.message = buildDestinationSwapCrossChainMessage({
    crossSwap: crossSwapWithAppFee,
    destinationSwapQuote: finalDestinationSwapQuote,
    bridgeableOutputToken,
    router: destinationRouter,
    appFee,
  });
  assertMinOutputAmount(
    finalDestinationSwapQuote.minAmountOut,
    crossSwapWithAppFee.amount,
    {
      actualAmountOut: "finalDestinationSwapQuote.minAmountOut",
      expectedMinAmountOut: "crossSwapWithAppFee.amount",
    }
  );
  assertMinOutputAmount(originSwapQuote.minAmountOut, bridgeQuote.inputAmount, {
    actualAmountOut: "originSwapQuote.minAmountOut",
    expectedMinAmountOut: "bridgeQuote.inputAmount",
  });

  return {
    crossSwap: crossSwapWithAppFee,
    destinationSwapQuote: finalDestinationSwapQuote,
    bridgeQuote,
    originSwapQuote,
    contracts: {
      originSwapEntryPoint,
      depositEntryPoint,
      originRouter: originRouter,
      destinationRouter: destinationRouter,
    },
    appFee,
  };
}

function _prepCrossSwapQuotesRetrievalA2A(params: {
  crossSwap: CrossSwap;
  bridgeRoute: {
    fromTokenAddress: string;
    fromChain: number;
    toTokenAddress: string;
    toChain: number;
  };
  strategies: QuoteFetchStrategies;
  strategiesToUseForComparison: "origin" | "destination";
  includeSources?: string[];
}): CrossSwapQuotesRetrievalA2AResult {
  const {
    crossSwap,
    bridgeRoute,
    strategies,
    strategiesToUseForComparison,
    includeSources,
  } = params;

  const originSwapChainId = crossSwap.inputToken.chainId;
  const destinationSwapChainId = crossSwap.outputToken.chainId;

  const _bridgeableInputToken = getTokenByAddress(
    bridgeRoute.fromTokenAddress,
    bridgeRoute.fromChain
  );
  const _bridgeableOutputToken = getTokenByAddress(
    bridgeRoute.toTokenAddress,
    bridgeRoute.toChain
  );

  if (!_bridgeableInputToken) {
    throw new Error(
      `No bridgeable input token found for ${bridgeRoute.fromTokenAddress} on chain ${bridgeRoute.fromChain}`
    );
  }

  if (!_bridgeableOutputToken) {
    throw new Error(
      `No bridgeable output token found for ${bridgeRoute.toTokenAddress} on chain ${bridgeRoute.toChain}`
    );
  }

  const bridgeableInputToken = {
    address: bridgeRoute.fromTokenAddress,
    decimals: _bridgeableInputToken.decimals,
    symbol: _bridgeableInputToken.symbol,
    chainId: bridgeRoute.fromChain,
  };
  const bridgeableOutputToken = {
    address: bridgeRoute.toTokenAddress,
    decimals: _bridgeableOutputToken.decimals,
    symbol: _bridgeableOutputToken.symbol,
    chainId: bridgeRoute.toChain,
  };

  const originStrategies = getQuoteFetchStrategies(
    originSwapChainId,
    crossSwap.inputToken.symbol,
    bridgeableInputToken.symbol,
    strategies
  );
  const destinationStrategies = getQuoteFetchStrategies(
    destinationSwapChainId,
    bridgeableOutputToken.symbol,
    crossSwap.outputToken.symbol,
    strategies
  );

  const baseStrategies =
    strategiesToUseForComparison === "origin"
      ? originStrategies
      : destinationStrategies;

  return baseStrategies.flatMap((strategy) => {
    try {
      const originStrategy =
        strategiesToUseForComparison === "origin"
          ? strategy
          : getMatchingStrategy({
              baseStrategy: strategy,
              otherStrategies: originStrategies,
              strictTradeType: crossSwap.strictTradeType,
              includeSources: includeSources,
              chainId: originSwapChainId,
            });
      const destinationStrategy =
        strategiesToUseForComparison === "destination"
          ? strategy
          : getMatchingStrategy({
              baseStrategy: strategy,
              otherStrategies: destinationStrategies,
              strictTradeType: crossSwap.strictTradeType,
              includeSources: includeSources,
              chainId: destinationSwapChainId,
            });

      const { swapAndBridge, originSwapInitialRecipient } =
        originStrategy.getOriginEntryPoints(originSwapChainId);
      const depositEntryPoint =
        originStrategy.getOriginEntryPoints(originSwapChainId).deposit;
      const originRouter = originStrategy.getRouter(originSwapChainId);
      const multiCallHandlerAddress = getMultiCallHandlerAddress(
        destinationSwapChainId
      );
      const destinationRouter = destinationStrategy.getRouter(
        destinationSwapChainId
      );

      const originSwap = {
        chainId: originSwapChainId,
        tokenIn: crossSwap.inputToken,
        tokenOut: bridgeableInputToken,
        recipient: crossSwap.isOriginSvm
          ? crossSwap.depositor
          : originSwapInitialRecipient.address,
        slippageTolerance: crossSwap.slippageTolerance,
        type: crossSwap.type,
      };
      const destinationSwap = {
        chainId: destinationSwapChainId,
        tokenIn: bridgeableOutputToken,
        tokenOut: crossSwap.outputToken,
        recipient: multiCallHandlerAddress,
        slippageTolerance: crossSwap.slippageTolerance,
        type: crossSwap.type,
      };

      return {
        originSwap,
        destinationSwap,
        originStrategy,
        destinationStrategy,
        originSwapChainId,
        destinationSwapChainId,
        originSwapEntryPoint: swapAndBridge,
        depositEntryPoint,
        bridgeableInputToken,
        bridgeableOutputToken,
        originRouter,
        destinationRouter,
      };
    } catch (error) {
      logger.debug({
        at: "_prepCrossSwapQuotesRetrievalA2A",
        message: "Could not map strategy",
        error,
      });
      return [];
    }
  });
}

export function getMatchingStrategy(params: {
  baseStrategy: QuoteFetchStrategy;
  otherStrategies: QuoteFetchStrategy[];
  strictTradeType: boolean;
  includeSources?: string[];
  chainId: number;
}) {
  const {
    baseStrategy,
    otherStrategies,
    strictTradeType,
    includeSources,
    chainId,
  } = params;

  // Helper to check if strategy matches source requirements
  const hasValidSources = (strategy: QuoteFetchStrategy): boolean => {
    const strategyHasSources = hasSources(strategy, chainId, {
      includeSources,
    });
    return strategyHasSources;
  };

  // Helper to create strategy filters
  const createFilter = (requirements: {
    sameName?: boolean;
    supportsSellBalance?: boolean;
    hasValidSources?: boolean;
  }) => {
    return (strategy: QuoteFetchStrategy): boolean => {
      if (
        requirements.sameName &&
        strategy.strategyName !== baseStrategy.strategyName
      ) {
        return false;
      }
      if (
        requirements.supportsSellBalance &&
        !supportsSellEntireBalance(strategy)
      ) {
        return false;
      }
      if (requirements.hasValidSources && !hasValidSources(strategy)) {
        return false;
      }
      return true;
    };
  };

  // Define fallback priority for strict mode
  const strictModeFallbacks = [
    // 1. Same name + supports sell entire balance + valid sources
    createFilter({
      sameName: true,
      supportsSellBalance: true,
      hasValidSources: true,
    }),
    // 2. Any strategy that supports sell entire balance + valid sources
    createFilter({ supportsSellBalance: true, hasValidSources: true }),
    // 3. Same name + supports sell entire balance
    createFilter({ sameName: true, supportsSellBalance: true }),
    // 4. Any strategy that supports sell entire balance
    createFilter({ supportsSellBalance: true }),
    // 5. Same name + valid sources (fallback when sell entire balance not available)
    createFilter({ sameName: true, hasValidSources: true }),
    // 4. Any strategy with valid sources
    createFilter({ hasValidSources: true }),
    // 7. Same name
    createFilter({ sameName: true }),
    // 8. Last resort: first available strategy
    () => true,
  ];

  // Define fallback priority for non-strict mode
  const nonStrictModeFallbacks = [
    // 1. Same name + valid sources
    createFilter({ sameName: true, hasValidSources: true }),
    // 2. Any strategy with valid sources
    createFilter({ hasValidSources: true }),
    // 3. Same name
    createFilter({ sameName: true }),
    // 4. Last resort: first available strategy
    () => true,
  ];

  const fallbacks = strictTradeType
    ? strictModeFallbacks
    : nonStrictModeFallbacks;

  // Try each fallback strategy in order of priority
  for (const filter of fallbacks) {
    const matchingStrategy = otherStrategies.find(filter);
    if (matchingStrategy) {
      return matchingStrategy;
    }
  }

  // This should never happen as the last fallback always returns true,
  // but included for safety
  return otherStrategies[0];
}

/**
 * Executes multiple strategy fetches based on configured prioritization mode.
 * @param strategyFetches - The strategy fetches to execute.
 * @param prioritizationMode - The prioritization mode to use.
 * - `equal-speed` - Executes all strategy fetches in parallel and returns the first
 *                   one that completes.
 * - `priority-speed` - Executes the first `priorityChunkSize` strategy fetches in
 *                      parallel and returns the first one that completes. If all
 *                      of the first `priorityChunkSize` strategy fetches fail,
 *                      the remaining strategy fetches are executed in parallel
 *                      and the first one that completes is returned.
 * @returns The prioritized strategy fetch.
 */
export async function executeStrategies<T>(
  strategyFetches: (() => Promise<T>)[],
  prioritizationMode: QuoteFetchPrioritizationMode = {
    mode: "equal-speed",
  }
): Promise<T> {
  try {
    if (strategyFetches.length === 0) {
      throw new SwapQuoteUnavailableError(
        {
          message: "No quotes available",
          code: AcrossErrorCode.SWAP_QUOTE_UNAVAILABLE,
        },
        {
          cause: new Error("No strategies to execute"),
        }
      );
    }

    // `equal-speed` mode
    if (prioritizationMode.mode === "equal-speed") {
      return await Promise.any(strategyFetches.map((fetch) => fetch()));
    }

    // `priority-speed` mode
    const errors: Error[] = [];
    // First fetch the priority chunk
    const priorityChunkSize = prioritizationMode.priorityChunkSize;
    const priorityChunkEndIndex = Math.min(
      priorityChunkSize,
      strategyFetches.length
    );
    const priorityFetches = strategyFetches.slice(0, priorityChunkEndIndex);
    try {
      const successfulFetch = await Promise.any(
        priorityFetches.map((fetch) => fetch())
      );
      return successfulFetch;
    } catch (error) {
      if (error instanceof AggregateError) {
        errors.push(...error.errors);
      } else {
        errors.push(error as Error);
      }
    }
    // If the priority chunk failed, fetch all the remaining strategies
    if (priorityChunkEndIndex < strategyFetches.length) {
      const remainingFetches = strategyFetches.slice(
        priorityChunkEndIndex,
        strategyFetches.length
      );
      try {
        const successfulFetch = await Promise.any(
          remainingFetches.map((fetch) => fetch())
        );
        return successfulFetch;
      } catch (error) {
        if (error instanceof AggregateError) {
          errors.push(...error.errors);
        } else {
          errors.push(error as Error);
        }
      }
    }
    throw new AggregateError(errors);
  } catch (error) {
    if (error instanceof AggregateError) {
      const errors = error.errors;

      // If all quote fetches errored with an InvalidParamError, throw the first one.
      if (
        errors.every(
          (error) =>
            error instanceof InvalidParamError &&
            (error.param === "excludeSources" ||
              error.param === "includeSources")
        )
      ) {
        throw errors[0];
      }

      // If all quote fetches errored, we need to determine which error to propagate to the
      // caller.
      throw getSwapQuoteUnavailableError(errors);
    }
    throw error;
  }
}

function assertSources(sources: QuoteFetchOpts["sources"]) {
  if (!sources || sources.sourcesKeys.length > 0) {
    return;
  }

  throw new InvalidParamError({
    param:
      sources.sourcesType === "exclude" ? "excludeSources" : "includeSources",
    message:
      "Couldn't fetch swap quotes based on the provided sources. " +
      "Call the endpoint /swap/sources?chainId=<CHAIN_ID> to get a list of valid sources.",
  });
}

function hasSources(
  strategy: QuoteFetchStrategy,
  chainId: number,
  opts?: {
    includeSources?: string[];
    excludeSources?: string[];
  }
) {
  try {
    assertSources(strategy.getSources(chainId, opts));
    return true;
  } catch (error) {
    return false;
  }
}

function supportsSellEntireBalance(strategy: QuoteFetchStrategy) {
  try {
    strategy.assertSellEntireBalanceSupported();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Executes quotes for multiple cross swap types and selects the best one.
 * For exact input, compare based on destination swap output amount if available, otherwise bridge output amount.
 * For exact output, compare based on destination swap input amount if available, otherwise bridge input amount.
 */
async function selectBestCrossSwapQuote(
  crossSwapQuotePromises: Promise<CrossSwapQuotes>[],
  crossSwap: CrossSwap
): Promise<CrossSwapQuotes> {
  const crossSwapQuotePromisesWithTimeout = crossSwapQuotePromises.map(
    (promise) =>
      addTimeoutToPromise(
        promise,
        PROMISE_TIMEOUT_MS,
        "Timeout while fetching swap quotes from providers"
      )
  );
  const crossSwapQuotes = await Promise.allSettled(
    crossSwapQuotePromisesWithTimeout
  );

  const fulfilledQuotes = crossSwapQuotes
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);

  if (fulfilledQuotes.length === 0) {
    const rejectedReasons = crossSwapQuotes
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason as Error);
    throw getSwapQuoteUnavailableError(rejectedReasons);
  }

  if (fulfilledQuotes.length === 1) {
    return fulfilledQuotes[0];
  }

  const bestQuote = fulfilledQuotes.reduce((best, current) => {
    const currentDestinationSwapQuote = current.destinationSwapQuote;
    const bestDestinationSwapQuote = best.destinationSwapQuote;
    const currentBridgeQuote = current.bridgeQuote;
    const bestBridgeQuote = best.bridgeQuote;
    const isExactInput = crossSwap.type === "exactInput";

    const currentAmount = currentDestinationSwapQuote
      ? isExactInput
        ? currentDestinationSwapQuote.expectedAmountOut
        : currentDestinationSwapQuote.expectedAmountIn
      : isExactInput
        ? currentBridgeQuote.outputAmount
        : currentBridgeQuote.inputAmount;
    const bestAmount = bestDestinationSwapQuote
      ? isExactInput
        ? bestDestinationSwapQuote.expectedAmountOut
        : bestDestinationSwapQuote.expectedAmountIn
      : isExactInput
        ? bestBridgeQuote.outputAmount
        : bestBridgeQuote.inputAmount;

    return isExactInput
      ? currentAmount.gt(bestAmount)
        ? current
        : best
      : currentAmount.lt(bestAmount)
        ? current
        : best;
  });

  return bestQuote;
}
