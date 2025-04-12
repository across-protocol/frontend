import { useHistory } from "react-router-dom";
import { cloneDeep } from "lodash";
import { useMutation } from "@tanstack/react-query";

import useReferrer from "hooks/useReferrer";
import { useQueryParams } from "hooks/useQueryParams";
import { useAmplitude } from "hooks/useAmplitude";
import {
  externalProjectNameToId,
  generateTransferSigned,
  generateTransferSubmitted,
} from "utils/amplitude";
import { ampli, DepositNetworkMismatchProperties } from "ampli";

import { FromBridgePagePayload } from "../useBridgeAction";
import { TransferQuote } from "../useTransferQuote";
import { SelectedRoute } from "../../utils";
import { BridgeActionStrategy, DepositArgs } from "./strategies/types";

export function createBridgeActionHook(strategy: BridgeActionStrategy) {
  return function useBridgeAction(
    dataLoading: boolean,
    selectedRoute: SelectedRoute,
    usedTransferQuote: TransferQuote
  ) {
    const history = useHistory();
    const { referrer, integratorId } = useReferrer();

    const params = useQueryParams();
    const existingIntegrator = params["integrator"];

    const { addToAmpliQueue } = useAmplitude();

    const isConnected = strategy.isConnected();
    const isWrongNetwork = strategy.isWrongNetwork(selectedRoute.fromChain);

    const bridgeActionHandler = useMutation({
      mutationFn: async () => {
        const frozenTransferQuote = cloneDeep(usedTransferQuote);
        const frozenQuoteForAnalytics = frozenTransferQuote?.quoteForAnalytics;
        const frozenInitialQuoteTime = frozenTransferQuote?.initialQuoteTime;
        const frozenDepositArgs = cloneDeep(
          getDepositArgs(
            selectedRoute,
            usedTransferQuote,
            referrer,
            integratorId
          )
        );
        const frozenSwapQuote = frozenTransferQuote?.quotedSwap;
        const frozenUniversalSwapQuote =
          frozenTransferQuote?.quotedUniversalSwap;
        const frozenFeeQuote = frozenTransferQuote?.quotedFees;
        const frozenLimits = frozenTransferQuote?.quotedLimits;
        const frozenTokenPrice = frozenTransferQuote?.quotePriceUSD;
        const frozenRoute = cloneDeep(selectedRoute);

        const externalProjectId = externalProjectNameToId(
          frozenRoute.externalProjectId
        );
        const isSwapRoute = frozenRoute.type === "swap";
        const isUniversalSwapRoute = frozenRoute.type === "universal-swap";

        if (
          !frozenDepositArgs ||
          !frozenFeeQuote ||
          !frozenQuoteForAnalytics ||
          !frozenInitialQuoteTime ||
          !frozenTokenPrice ||
          !frozenLimits ||
          // If swap route, we need also the swap quote
          (isSwapRoute && !frozenSwapQuote) ||
          (isUniversalSwapRoute && !frozenUniversalSwapQuote)
        ) {
          throw new Error("Missing required data for bridge action");
        }

        await strategy.approveTokens({
          depositArgs: frozenDepositArgs,
          transferQuote: frozenTransferQuote,
          selectedRoute: frozenRoute,
        });

        addToAmpliQueue(() => {
          // Instrument amplitude before sending the transaction for the submit button.
          ampli.transferSubmitted(
            generateTransferSubmitted(
              frozenQuoteForAnalytics,
              referrer,
              frozenInitialQuoteTime,
              externalProjectId
            )
          );
        });
        const timeSubmitted = Date.now();
        const networkMismatchHandler = (
          networkMismatchProperties: DepositNetworkMismatchProperties
        ) => {
          addToAmpliQueue(() => {
            ampli.depositNetworkMismatch(networkMismatchProperties);
          });
        };
        const txHash = await strategy.sendDepositTx({
          depositArgs: frozenDepositArgs,
          transferQuote: frozenTransferQuote,
          selectedRoute: frozenRoute,
          onNetworkMismatch: networkMismatchHandler,
        });
        addToAmpliQueue(() => {
          ampli.transferSigned(
            generateTransferSigned(
              frozenQuoteForAnalytics,
              referrer,
              timeSubmitted,
              txHash,
              externalProjectId
            )
          );
        });

        const fromBridgePagePayload: FromBridgePagePayload = {
          expectedFillTime: frozenTransferQuote.estimatedTime.formattedString,
          timeSigned: Date.now(),
          recipient: frozenDepositArgs.toAddress,
          referrer,
          swapQuote: frozenSwapQuote,
          universalSwapQuote: frozenUniversalSwapQuote,
          selectedRoute: frozenRoute,
          quote: frozenFeeQuote,
          quotedLimits: frozenLimits,
          quoteForAnalytics: frozenQuoteForAnalytics,
          depositArgs: frozenDepositArgs,
          tokenPrice: frozenTokenPrice.toString(),
        };
        const statusPageSearchParams = new URLSearchParams({
          originChainId: String(frozenRoute.fromChain),
          destinationChainId: String(frozenRoute.toChain),
          inputTokenSymbol: isSwapRoute
            ? frozenRoute.toTokenSymbol
            : frozenRoute.fromTokenSymbol,
          outputTokenSymbol: frozenRoute.toTokenSymbol,
          referrer,
          ...(externalProjectId
            ? { externalProjectId: frozenRoute.externalProjectId }
            : {}),
        });
        if (existingIntegrator) {
          statusPageSearchParams.set("integrator", existingIntegrator);
        }
        history.push(
          `/bridge/${txHash}?${statusPageSearchParams}`,
          // This state is stored in session storage and therefore persist
          // after a refresh of the deposit status page.
          { fromBridgePagePayload }
        );
      },
    });

    const buttonDisabled =
      !usedTransferQuote ||
      (isConnected && dataLoading) ||
      bridgeActionHandler.isPending;

    return {
      isConnected,
      buttonActionHandler: bridgeActionHandler.mutate,
      isButtonActionLoading: bridgeActionHandler.isPending,
      didActionError: bridgeActionHandler.isError,
      buttonLabel: getButtonLabel({
        isConnected,
        isDataLoading: dataLoading,
        isMutating: bridgeActionHandler.isPending,
        isWrongNetwork,
      }),
      buttonDisabled,
    };
  };
}

function getDepositArgs(
  selectedRoute: SelectedRoute,
  usedTransferQuote: TransferQuote,
  referrer: string,
  integratorId: string
): DepositArgs | undefined {
  const { amountToBridgeAfterSwap, initialAmount, quotedFees, recipient } =
    usedTransferQuote || {};

  if (
    !usedTransferQuote ||
    !quotedFees ||
    !amountToBridgeAfterSwap ||
    !initialAmount ||
    !recipient
  ) {
    return undefined;
  }

  return {
    initialAmount,
    amount: amountToBridgeAfterSwap,
    fromChain: selectedRoute.fromChain,
    toChain: selectedRoute.toChain,
    timestamp: quotedFees.quoteTimestamp,
    referrer,
    relayerFeePct: quotedFees.totalRelayFee.pct,
    tokenAddress: selectedRoute.fromTokenAddress,
    isNative: selectedRoute.isNative,
    toAddress: recipient,
    exclusiveRelayer: quotedFees.exclusiveRelayer,
    exclusivityDeadline: quotedFees.exclusivityDeadline,
    integratorId,
    externalProjectId: selectedRoute.externalProjectId,
  };
}

function getButtonLabel(args: {
  isConnected: boolean;
  isDataLoading: boolean;
  isMutating: boolean;
  isWrongNetwork: boolean;
}) {
  if (!args.isConnected) {
    return "Connect wallet";
  }
  if (args.isMutating) {
    return "Confirming...";
  }
  if (args.isWrongNetwork) {
    return "Switch network and confirm transaction";
  }
  return "Confirm transaction";
}
