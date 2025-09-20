import { BigNumber } from "ethers";

import {
  getTokenByAddress,
  HUB_POOL_CHAIN_ID,
  isRouteEnabled,
  ConvertDecimals,
} from "../_utils";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../_constants";
import {
  CORE_WRITER_EVM_ADDRESS,
  encodeTransferOnCoreCalldata,
} from "../_hypercore";
import { InvalidParamError } from "../_errors";
import { getFallbackRecipient, type AppFee } from "./utils";
import {
  encodeTransferCalldata,
  buildMulticallHandlerMessage,
} from "../_multicall-handler";

import indirectChains from "../../src/data/indirect_chains_1.json";

import { CrossSwap, IndirectDestinationRoute } from "./types";

export function isIndirectDestinationRouteSupported(params: {
  originChainId: number;
  destinationChainId: number;
  inputToken: string;
  outputToken: string;
}) {
  return getIndirectDestinationRoutes(params).length > 0;
}

export function getIndirectDestinationRoutes(params: {
  originChainId: number;
  destinationChainId: number;
  inputToken: string;
  outputToken: string;
}): IndirectDestinationRoute[] {
  const indirectChainDestination = indirectChains.find(
    (chain) =>
      chain.chainId === params.destinationChainId &&
      chain.intermediaryChains &&
      chain.outputTokens.some(
        (token) =>
          token.address.toLowerCase() === params.outputToken.toLowerCase()
      )
  );

  if (!indirectChainDestination) {
    return [];
  }

  const indirectDestinationRoutes =
    indirectChainDestination.intermediaryChains.flatMap(
      (_intermediaryChainId) => {
        // Check if the indirect destination chain has token enabled
        const isIntermediaryOutputTokenEnabled =
          indirectChainDestination.outputTokens.some(
            (token) => token.address === params.outputToken
          );
        if (!isIntermediaryOutputTokenEnabled) {
          return [];
        }

        // Check if input token is known
        const inputToken = getTokenByAddress(
          params.inputToken,
          params.originChainId
        );
        if (!inputToken) {
          return [];
        }

        // Check if the indirect destination chain supports the intermediary chain
        const indirectOutputToken = getTokenByAddress(
          params.outputToken,
          params.destinationChainId
        );
        if (!indirectOutputToken) {
          return [];
        }

        // Check if L1 token is known
        const l1TokenAddress =
          TOKEN_SYMBOLS_MAP[inputToken.symbol as keyof typeof TOKEN_SYMBOLS_MAP]
            ?.addresses[HUB_POOL_CHAIN_ID];
        if (!l1TokenAddress) {
          return [];
        }
        const l1Token = getTokenByAddress(l1TokenAddress, HUB_POOL_CHAIN_ID);
        if (!l1Token) {
          return [];
        }

        // Check if intermediary output token is known
        const intermediaryOutputTokenAddress =
          l1Token.addresses[_intermediaryChainId];
        if (!intermediaryOutputTokenAddress) {
          return [];
        }
        const intermediaryOutputToken = getTokenByAddress(
          intermediaryOutputTokenAddress,
          _intermediaryChainId
        );
        if (!intermediaryOutputToken) {
          return [];
        }

        // Check if there is a route from the origin chain to the intermediary chain
        if (
          !isRouteEnabled(
            params.originChainId,
            _intermediaryChainId,
            params.inputToken,
            intermediaryOutputTokenAddress
          )
        ) {
          return [];
        }

        return {
          inputToken: {
            symbol: inputToken.symbol,
            name: inputToken.name,
            decimals: inputToken.decimals,
            address: inputToken.addresses[params.originChainId],
            chainId: params.originChainId,
            coingeckoId: inputToken.coingeckoId,
          },
          intermediaryOutputToken: {
            symbol: intermediaryOutputToken.symbol,
            name: intermediaryOutputToken.name,
            decimals: intermediaryOutputToken.decimals,
            address: intermediaryOutputToken.addresses[_intermediaryChainId],
            chainId: _intermediaryChainId,
            coingeckoId: intermediaryOutputToken.coingeckoId,
          },
          outputToken: {
            symbol: indirectOutputToken.symbol,
            name: indirectOutputToken.name,
            decimals: indirectOutputToken.decimals,
            address: indirectOutputToken.addresses[params.destinationChainId],
            chainId: params.destinationChainId,
            coingeckoId: indirectOutputToken.coingeckoId,
          },
        };
      }
    );

  return indirectDestinationRoutes;
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
  indirectDestinationRoute: ReturnType<typeof getIndirectDestinationRoutes>[0],
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
    fallbackRecipient: getFallbackRecipient(crossSwap),
    actions: [
      ...transferToHyperCoreActions,
      ...appFeeActions,
      ...spotSendActions,
    ],
  });
}
