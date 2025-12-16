import { useCallback, useRef } from "react";
import { ampli, TransferFillCompletedProperties } from "ampli";
import { useAmplitude } from "hooks";
import { getChainInfo } from "utils";
import { FromBridgeAndSwapPagePayload } from "utils/local-deposits";

type TrackTransferFillCompletedParams = {
  fillTxHash: string;
  succeeded: boolean;
  fillCompleteTimestamp: number;
  depositCompleteTimestamp: number;
  fillAmount: string;
  totalFilledAmount: string;
};

export function useTrackTransferFillCompleted(
  fromBridgeAndSwapPagePayload: FromBridgeAndSwapPagePayload | undefined
) {
  const { addToAmpliQueue } = useAmplitude();
  const hasTrackedRef = useRef(false);

  const trackTransferFillCompleted = useCallback(
    (params: TrackTransferFillCompletedParams) => {
      if (!fromBridgeAndSwapPagePayload || hasTrackedRef.current) return;
      hasTrackedRef.current = true;

      const {
        fillTxHash,
        succeeded,
        fillCompleteTimestamp,
        depositCompleteTimestamp,
        fillAmount,
        totalFilledAmount,
      } = params;
      const { swapQuote, referrer, tradeType } = fromBridgeAndSwapPagePayload;

      const fillTimeInMs =
        depositCompleteTimestamp > 0
          ? fillCompleteTimestamp - depositCompleteTimestamp
          : 0;

      const fromChainInfo = getChainInfo(swapQuote.inputToken.chainId);
      const toChainInfo = getChainInfo(swapQuote.outputToken.chainId);
      const bridgeStep = swapQuote.steps.bridge;
      const bridgeFeeDetails = bridgeStep.fees.details;

      const properties: TransferFillCompletedProperties = {
        transactionHash: fillTxHash,
        succeeded,
        fillCompleteTimestamp: String(fillCompleteTimestamp),
        depositCompleteTimestamp: String(depositCompleteTimestamp),
        fillTimeInMs: String(fillTimeInMs),
        fillAmount,
        fillAmountUsd: swapQuote.fees?.total.amountUsd ?? "0",
        totalFilledAmount,
        totalFilledAmountUsd: swapQuote.fees?.total.amountUsd ?? "0",
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
        sender: fromBridgeAndSwapPagePayload.sender,
        recipient: fromBridgeAndSwapPagePayload.recipient,
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
        swapType:
          swapQuote.crossSwapType as TransferFillCompletedProperties["swapType"],
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
        ampli.transferFillCompleted(properties);
      });
    },
    [fromBridgeAndSwapPagePayload, addToAmpliQueue]
  );

  return { trackTransferFillCompleted };
}
