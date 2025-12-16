import { useCallback, useRef } from "react";
import { ampli, TransferDepositCompletedProperties } from "ampli";
import { useAmplitude } from "hooks";
import { getChainInfo } from "utils";
import { FromBridgeAndSwapPagePayload } from "utils/local-deposits";

type TrackTransferDepositCompletedParams = {
  transactionHash: string;
  succeeded: boolean;
  depositCompleteTimestamp: number;
};

export function useTrackTransferDepositCompleted(
  fromBridgeAndSwapPagePayload: FromBridgeAndSwapPagePayload | undefined
) {
  const { addToAmpliQueue } = useAmplitude();
  const hasTrackedRef = useRef(false);

  const trackTransferDepositCompleted = useCallback(
    (params: TrackTransferDepositCompletedParams) => {
      // If we do not have a fromBridgeAndSwapPagePayload here, it means that the
      // user has Access the page through the URL and not through the in-app
      // rounding, and we do not want to track the event.
      if (!fromBridgeAndSwapPagePayload || hasTrackedRef.current) return;
      hasTrackedRef.current = true;

      const { transactionHash, succeeded, depositCompleteTimestamp } = params;
      const { swapQuote, timeSigned, referrer, tradeType } =
        fromBridgeAndSwapPagePayload;

      const timeFromTransferSignedToTransferCompleteInMilliseconds =
        timeSigned > 0 ? depositCompleteTimestamp - timeSigned : 0;

      const fromChainInfo = getChainInfo(swapQuote.inputToken.chainId);
      const toChainInfo = getChainInfo(swapQuote.outputToken.chainId);
      const bridgeStep = swapQuote.steps.bridge;
      const bridgeFeeDetails = bridgeStep.fees.details;

      const sender = fromBridgeAndSwapPagePayload.sender;
      const recipient = fromBridgeAndSwapPagePayload.recipient;
      const swapType = getSwapType(swapQuote.crossSwapType);

      const properties: TransferDepositCompletedProperties = {
        transactionHash,
        succeeded,
        depositCompleteTimestamp: String(depositCompleteTimestamp),
        timeFromTransferSignedToTransferCompleteInMilliseconds: String(
          timeFromTransferSignedToTransferCompleteInMilliseconds
        ),
        fromChainId: String(swapQuote.inputToken.chainId),
        fromChainName: fromChainInfo.name,
        toChainId: String(swapQuote.outputToken.chainId),
        toChainName: toChainInfo.name,
        fromTokenAddress: swapQuote.inputToken.address,
        fromTokenSymbol: swapQuote.inputToken.symbol,
        toTokenAddress: swapQuote.outputToken.address,
        toTokenSymbol: swapQuote.outputToken.symbol,
        bridgeTokenAddress: bridgeStep.tokenIn.address,
        bridgeTokenSymbol: bridgeStep.tokenIn.symbol,
        fromAmount: swapQuote.inputAmount.toString(),
        fromAmountUsd:
          swapQuote.fees?.total.details.swapImpact.amountUsd ?? "0",
        toAmount: swapQuote.expectedOutputAmount.toString(),
        toAmountUsd: swapQuote.fees?.total.amountUsd ?? "0",
        sender,
        recipient,
        isSenderEqRecipient: sender.toLowerCase() === recipient.toLowerCase(),
        routeChainIdFromTo: `${swapQuote.inputToken.chainId}-${swapQuote.outputToken.chainId}`,
        routeChainNameFromTo: `${fromChainInfo.name}-${toChainInfo.name}`,
        expectedFillTimeInSec: String(swapQuote.expectedFillTime),
        expectedFillTimeInSecLowerBound: String(swapQuote.expectedFillTime),
        expectedFillTimeInSecUpperBound: String(swapQuote.expectedFillTime),
        lpFeePct: bridgeFeeDetails?.lp.pct.toString() ?? "0",
        lpFeeTotalUsd: bridgeFeeDetails?.lp.amount.toString() ?? "0",
        capitalFeePct: bridgeFeeDetails?.relayerCapital.pct.toString() ?? "0",
        capitalFeeTotalUsd:
          bridgeFeeDetails?.relayerCapital.amount.toString() ?? "0",
        relayGasFeePct: bridgeFeeDetails?.destinationGas.pct.toString() ?? "0",
        relayGasFeeTotalUsd:
          bridgeFeeDetails?.destinationGas.amount.toString() ?? "0",
        relayFeePct: bridgeStep.fees.pct.toString(),
        relayFeeTotalUsd: bridgeStep.fees.amount.toString(),
        quoteLatencyMilliseconds: "0",
        quoteTimestamp: String(timeSigned),
        transferQuoteBlockNumber: "0",
        swapType,
        inputType: tradeType,
        inputUnits: "token",
        destinationSwapFeePct:
          swapQuote.fees?.total.details.swapImpact.pct?.toString() ?? "0",
        destinationSwapFeeUsd:
          swapQuote.fees?.total.details.swapImpact.amountUsd ?? "0",
        originSwapFeePct:
          swapQuote.fees?.total.details.swapImpact.pct?.toString() ?? "0",
        originSwapFeeUsd:
          swapQuote.fees?.total.details.swapImpact.amountUsd ?? "0",
        originGasFeePct: swapQuote.fees?.originGas.pct?.toString() ?? "0",
        originGasFeeUsd: swapQuote.fees?.originGas.amountUsd ?? "0",
        appFeePct: swapQuote.fees?.total.details.app.pct?.toString() ?? "0",
        appFeeUsd: swapQuote.fees?.total.details.app.amountUsd ?? "0",
        totalFeePct: swapQuote.fees?.total.pct?.toString() ?? "0",
        totalFeeUsd: swapQuote.fees?.total.amountUsd ?? "0",
        referralProgramAddress: referrer || undefined,
      };

      addToAmpliQueue(() => {
        ampli.transferDepositCompleted(properties);
      });
    },
    [fromBridgeAndSwapPagePayload, addToAmpliQueue]
  );

  return { trackTransferDepositCompleted };
}

function getSwapType(
  crossSwapType: string
): TransferDepositCompletedProperties["swapType"] {
  switch (crossSwapType) {
    case "anyToAny":
      return "anyToAny";
    case "bridgeToAny":
      return "bridgeToAny";
    case "anyToBridge":
      return "anyToBridge";
    case "bridgeToBridge":
      return "bridgeToBridge";
    default:
      return undefined;
  }
}
