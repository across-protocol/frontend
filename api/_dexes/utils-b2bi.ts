import { BigNumber } from "ethers";

import {
  getTokenByAddress,
  HUB_POOL_CHAIN_ID,
  isRouteEnabled,
  ConvertDecimals,
  getLogger,
} from "../_utils";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../_constants";
import {
  CORE_WRITER_EVM_ADDRESS,
  encodeTransferOnCoreCalldata,
} from "../_hypercore";
import { InvalidParamError } from "../_errors";
import { getAcrossFallbackRecipient, type AppFee } from "./utils";
import {
  encodeTransferCalldata,
  buildMulticallHandlerMessage,
} from "../_multicall-handler";
import { BRIDGEABLE_OUTPUT_TOKEN_PER_OUTPUT_TOKEN } from "../_bridges/hypercore-intent/utils/constants";

import indirectChainsImport from "../../src/data/indirect_chains_1.json";
import mainnetChains from "../../src/data/chains_1.json";
import { CrossSwap, IndirectDestinationRoute } from "./types";

const logger = getLogger();

const ENABLED_INDIRECT_TOKEN_PAIRS: {
  inputToken: string;
  outputToken: string;
}[] = [
  {
    inputToken: "USDT",
    outputToken: "USDT-SPOT",
  },
];

// Type cast to avoid TypeScript inferring never[] when indirect_chains_1.json or any of its nested arrays are empty.
// Extends mainnetChains type with intermediaryChain property specific to indirect chains.
const indirectChains = indirectChainsImport as Array<
  (typeof mainnetChains)[number] & {
    intermediaryChain: number;
  }
>;

export function isIndirectDestinationRouteSupported(params: {
  originChainId: number;
  destinationChainId: number;
  inputToken: string;
  outputToken: string;
}) {
  return getIndirectDestinationRoute(params) !== undefined;
}

export function getIndirectDestinationRoute(params: {
  originChainId: number;
  destinationChainId: number;
  inputToken: string;
  outputToken: string;
}): IndirectDestinationRoute | undefined {
  logger.debug({
    at: "getIndirectDestinationRoute",
    message: "Starting indirect route lookup",
    params,
  });

  const indirectChainDestination = indirectChains.find(
    (chain) =>
      chain.chainId === params.destinationChainId &&
      chain.intermediaryChain &&
      chain.outputTokens.some(
        (token) =>
          token.address.toLowerCase() === params.outputToken.toLowerCase()
      )
  );

  if (!indirectChainDestination) {
    logger.debug({
      at: "getIndirectDestinationRoute",
      message: "No indirect chain destination found",
      destinationChainId: params.destinationChainId,
    });
    return;
  }

  const intermediaryChainId = indirectChainDestination.intermediaryChain;
  logger.debug({
    at: "getIndirectDestinationRoute",
    message: "Found indirect chain destination",
    intermediaryChainId,
  });

  // Check if the indirect destination chain has token enabled
  const isIntermediaryOutputTokenEnabled =
    indirectChainDestination.outputTokens.some(
      (token) => token.address === params.outputToken
    );
  if (!isIntermediaryOutputTokenEnabled) {
    logger.debug({
      at: "getIndirectDestinationRoute",
      message: "Output token not enabled on intermediary chain",
      outputToken: params.outputToken,
    });
    return;
  }

  // Check if input token is known
  const inputToken = getTokenByAddress(params.inputToken, params.originChainId);
  if (!inputToken) {
    logger.debug({
      at: "getIndirectDestinationRoute",
      message: "Input token not found",
      inputToken: params.inputToken,
      originChainId: params.originChainId,
    });
    return;
  }
  logger.debug({
    at: "getIndirectDestinationRoute",
    message: "Input token found",
    inputTokenSymbol: inputToken.symbol,
  });

  // Check if the indirect destination chain supports the intermediary chain
  const indirectOutputToken = getTokenByAddress(
    params.outputToken,
    params.destinationChainId
  );
  if (!indirectOutputToken) {
    logger.debug({
      at: "getIndirectDestinationRoute",
      message: "Output token not found on destination chain",
      outputToken: params.outputToken,
      destinationChainId: params.destinationChainId,
    });
    return;
  }

  // For HyperCore routes, we need to determine the bridgeable token on the intermediary chain
  // For B2BI: input is already bridgeable (USDT), use input token
  // For A2B: input is NOT bridgeable (WETH), use bridgeable mapping from output token (USDT-SPOT → USDT)

  let l1Token;
  const bridgeableTokenInfo =
    BRIDGEABLE_OUTPUT_TOKEN_PER_OUTPUT_TOKEN[
      indirectOutputToken.symbol as keyof typeof BRIDGEABLE_OUTPUT_TOKEN_PER_OUTPUT_TOKEN
    ];

  if (bridgeableTokenInfo) {
    // Use bridgeable token mapping (works for both A2B and B2BI)
    logger.debug({
      at: "getIndirectDestinationRoute",
      message: "Using bridgeable token mapping from output token",
      outputTokenSymbol: indirectOutputToken.symbol,
      bridgeableTokenSymbol: bridgeableTokenInfo.symbol,
    });
    const l1TokenAddress = bridgeableTokenInfo.addresses[HUB_POOL_CHAIN_ID];
    if (!l1TokenAddress) {
      logger.debug({
        at: "getIndirectDestinationRoute",
        message: "L1 token address not found for bridgeable token",
        bridgeableTokenSymbol: bridgeableTokenInfo.symbol,
        hubPoolChainId: HUB_POOL_CHAIN_ID,
      });
      return;
    }
    l1Token = getTokenByAddress(l1TokenAddress, HUB_POOL_CHAIN_ID);
  } else {
    // Fallback: use input token (legacy B2BI behavior)
    logger.debug({
      at: "getIndirectDestinationRoute",
      message: "No bridgeable mapping found, using input token",
      inputTokenSymbol: inputToken.symbol,
    });
    const l1TokenAddress =
      TOKEN_SYMBOLS_MAP[inputToken.symbol as keyof typeof TOKEN_SYMBOLS_MAP]
        ?.addresses[HUB_POOL_CHAIN_ID];
    if (!l1TokenAddress) {
      logger.debug({
        at: "getIndirectDestinationRoute",
        message: "L1 token address not found",
        inputTokenSymbol: inputToken.symbol,
        hubPoolChainId: HUB_POOL_CHAIN_ID,
      });
      return;
    }
    l1Token = getTokenByAddress(l1TokenAddress, HUB_POOL_CHAIN_ID);
  }

  if (!l1Token) {
    logger.debug({
      at: "getIndirectDestinationRoute",
      message: "L1 token not found",
      hubPoolChainId: HUB_POOL_CHAIN_ID,
    });
    return;
  }
  logger.debug({
    at: "getIndirectDestinationRoute",
    message: "L1 token found",
    l1TokenSymbol: l1Token.symbol,
  });

  // Check if intermediary output token is known
  const intermediaryOutputTokenAddress = l1Token.addresses[intermediaryChainId];
  if (!intermediaryOutputTokenAddress) {
    logger.debug({
      at: "getIndirectDestinationRoute",
      message: "Intermediary output token address not found",
      l1TokenSymbol: l1Token.symbol,
      intermediaryChainId,
    });
    return;
  }
  const intermediaryOutputToken = getTokenByAddress(
    intermediaryOutputTokenAddress,
    indirectChainDestination.intermediaryChain
  );
  if (!intermediaryOutputToken) {
    logger.debug({
      at: "getIndirectDestinationRoute",
      message: "Intermediary output token not found",
      intermediaryOutputTokenAddress,
      intermediaryChainId,
    });
    return;
  }
  logger.debug({
    at: "getIndirectDestinationRoute",
    message: "Intermediary output token found",
    intermediaryOutputTokenSymbol: intermediaryOutputToken.symbol,
  });

  // Check if there is a route from the origin chain to the intermediary chain
  // For both A2B and B2BI: we need to check if the bridgeable token can be bridged
  // Get the bridgeable token address on the origin chain
  const originBridgeTokenAddress = bridgeableTokenInfo
    ? bridgeableTokenInfo.addresses[params.originChainId]
    : TOKEN_SYMBOLS_MAP[inputToken.symbol as keyof typeof TOKEN_SYMBOLS_MAP]
        ?.addresses[params.originChainId];

  if (!originBridgeTokenAddress) {
    logger.debug({
      at: "getIndirectDestinationRoute",
      message: "Origin bridge token address not found",
      bridgeableTokenSymbol: bridgeableTokenInfo?.symbol || inputToken.symbol,
      originChainId: params.originChainId,
    });
    return;
  }

  const routeEnabled = isRouteEnabled(
    params.originChainId,
    intermediaryChainId,
    originBridgeTokenAddress,
    intermediaryOutputTokenAddress
  );
  logger.debug({
    at: "getIndirectDestinationRoute",
    message: "Route enabled check",
    originChainId: params.originChainId,
    intermediaryChainId,
    originBridgeTokenAddress,
    intermediaryOutputTokenAddress,
    routeEnabled,
  });
  if (!routeEnabled) {
    return;
  }

  const indirectDestinationRoute: IndirectDestinationRoute = {
    inputToken: {
      symbol: inputToken.symbol,
      decimals: inputToken.decimals,
      address: inputToken.addresses[params.originChainId],
      chainId: params.originChainId,
    },
    intermediaryOutputToken: {
      symbol: intermediaryOutputToken.symbol,
      decimals: intermediaryOutputToken.decimals,
      address: intermediaryOutputToken.addresses[intermediaryChainId],
      chainId: intermediaryChainId,
    },
    outputToken: {
      symbol: indirectOutputToken.symbol,
      decimals: indirectOutputToken.decimals,
      address: indirectOutputToken.addresses[params.destinationChainId],
      chainId: params.destinationChainId,
    },
  };

  // For A2B flows: Check if the output token is enabled (input can be any token)
  // For B2BI flows: Check if the input/output pair is enabled (input must be bridgeable)
  const isBridgeableInput =
    bridgeableTokenInfo?.symbol === indirectDestinationRoute.inputToken.symbol;
  const isEnabled = ENABLED_INDIRECT_TOKEN_PAIRS.find((pair) => {
    // A2B: Only check output token since input can be any token
    if (!isBridgeableInput) {
      return pair.outputToken === indirectDestinationRoute.outputToken.symbol;
    }
    // B2BI: Check both input and output tokens
    return (
      pair.inputToken === indirectDestinationRoute.inputToken.symbol &&
      pair.outputToken === indirectDestinationRoute.outputToken.symbol
    );
  });

  logger.debug({
    at: "getIndirectDestinationRoute",
    message: "Enabled token pair check",
    isBridgeableInput,
    inputTokenSymbol: indirectDestinationRoute.inputToken.symbol,
    outputTokenSymbol: indirectDestinationRoute.outputToken.symbol,
    isEnabled: !!isEnabled,
  });

  if (!isEnabled) {
    return;
  }

  return indirectDestinationRoute;
}

export function getIndirectBridgeQuoteMessage(
  crossSwap: CrossSwap,
  bridgeableOutputAmount: BigNumber,
  indirectDestinationRoute: IndirectDestinationRoute,
  appFee?: AppFee
) {
  const { intermediaryOutputToken, outputToken } = indirectDestinationRoute;
  const indirectBridgeRouteKey = [
    intermediaryOutputToken.symbol,
    intermediaryOutputToken.chainId,
    outputToken.symbol,
    outputToken.chainId,
  ].join(":");

  switch (indirectBridgeRouteKey) {
    case `USDT:${CHAIN_IDs.HYPEREVM}:USDT-SPOT:${CHAIN_IDs.HYPERCORE}`:
      return _buildIndirectBridgeQuoteMessageToHyperCore(
        crossSwap,
        bridgeableOutputAmount,
        indirectDestinationRoute,
        appFee
      );
    default:
      throw new InvalidParamError({
        message: `Unsupported indirect bridge route: ${indirectBridgeRouteKey}`,
      });
  }
}

function _buildIndirectBridgeQuoteMessageToHyperCore(
  crossSwap: CrossSwap,
  bridgeableOutputAmount: BigNumber,
  indirectDestinationRoute: IndirectDestinationRoute,
  appFee?: AppFee
) {
  const { intermediaryOutputToken, outputToken } = indirectDestinationRoute;

  if (crossSwap.outputToken.chainId !== CHAIN_IDs.HYPERCORE) {
    throw new InvalidParamError({
      message: "Destination chain must be 1337 (HyperCore).",
    });
  }

  if (intermediaryOutputToken.chainId !== CHAIN_IDs.HYPEREVM) {
    throw new InvalidParamError({
      message: "Intermediary output token must be on HyperEVM.",
    });
  }

  // Output token address must be a HyperCore system address:
  // https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm/hypercore-less-than-greater-than-hyperevm-transfers#system-addresses
  if (!outputToken.address.startsWith("0x20")) {
    throw new InvalidParamError({
      message: "Output token address must be a HyperCore system address.",
    });
  }

  // FIXME: Add support for destination chain actions if possible
  if (crossSwap.embeddedActions.length > 0) {
    throw new InvalidParamError({
      message:
        "Destination chain actions on HyperCore are not currently not supported.",
    });
  }

  return _buildBridgeQuoteMessageToHyperCore(
    crossSwap,
    bridgeableOutputAmount,
    indirectDestinationRoute,
    appFee
  );
}

function _buildBridgeQuoteMessageToHyperCore(
  crossSwap: CrossSwap,
  bridgeableOutputAmount: BigNumber,
  indirectDestinationRoute: IndirectDestinationRoute,
  appFee?: AppFee
) {
  const {
    intermediaryOutputToken: hyperEvmToken, // HyperEVM
    outputToken: hyperCoreToken, // HyperCore
  } = indirectDestinationRoute;

  // App fee amount in HyperCore decimals
  const appFeeAmountOnHyperCore = appFee
    ? ConvertDecimals(
        appFee.feeToken.decimals,
        hyperCoreToken.decimals
      )(appFee.feeAmount)
    : BigNumber.from(0);
  // Bridgeable output amount in HyperCore decimals
  const bridgeableOutputAmountOnHyperCore = ConvertDecimals(
    hyperEvmToken.decimals,
    hyperCoreToken.decimals
  )(bridgeableOutputAmount);

  // 1. Transfer HyperEVM token from MulticallHandler to HyperCore by sending to
  // respective system address
  const transferToHyperCoreActions = [
    {
      target: hyperEvmToken.address,
      callData: encodeTransferCalldata(
        hyperCoreToken.address,
        bridgeableOutputAmount // in HyperEVM decimals
      ),
      value: "0",
    },
  ];

  // 2. Spot send on HyperCore to app fee recipient if set
  const appFeeActions =
    appFee?.feeActions && crossSwap.appFeeRecipient
      ? // We can't reuse standard app fee actions on HyperCore
        [
          {
            target: CORE_WRITER_EVM_ADDRESS,
            callData: encodeTransferOnCoreCalldata({
              recipientAddress: crossSwap.appFeeRecipient,
              tokenSystemAddress: hyperCoreToken.address,
              amount: appFeeAmountOnHyperCore,
            }),
            value: "0",
          },
        ]
      : [];

  // 3. Spot send on HyperCore to recipient
  const spotSendActions = [
    {
      target: CORE_WRITER_EVM_ADDRESS,
      callData: encodeTransferOnCoreCalldata({
        recipientAddress: crossSwap.recipient,
        tokenSystemAddress: hyperCoreToken.address,
        amount: bridgeableOutputAmountOnHyperCore.sub(appFeeAmountOnHyperCore),
      }),
      value: "0",
    },
  ];

  return buildMulticallHandlerMessage({
    fallbackRecipient: getAcrossFallbackRecipient(crossSwap),
    actions: [
      ...transferToHyperCoreActions,
      ...appFeeActions,
      ...spotSendActions,
    ],
  });
}
