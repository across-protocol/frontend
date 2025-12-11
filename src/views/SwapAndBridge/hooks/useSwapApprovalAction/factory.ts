import { useMutation } from "@tanstack/react-query";
import { SwapApprovalActionStrategy } from "./strategies/types";
import { SwapApprovalQuote } from "utils/serverless-api/prod/swap-approval";
import { useHistory } from "react-router-dom";
import {
  buildSearchParams,
  externalProjectNameToId,
  formatWeiPct,
  getChainInfo,
} from "utils";
import useReferrer from "hooks/useReferrer";
import { createFromBridgeAndSwapPagePayload } from "utils/local-deposits";
import { useAmplitude } from "hooks";
import { ampli } from "ampli";
import { generateTransferQuoteFromSwapQuote } from "utils/amplitude";
import { BigNumber, utils as ethersUtils } from "ethers";
import { useRef } from "react";

export function createSwapApprovalActionHook(
  strategy: SwapApprovalActionStrategy
) {
  return function useSwapApprovalAction(swapQuote?: SwapApprovalQuote) {
    const history = useHistory();
    const { referrer } = useReferrer();
    const { addToAmpliQueue } = useAmplitude();
    const initialSubmissionTimeRef = useRef<number>();
    const isConnected = strategy.isConnected();
    const isWrongNetwork = swapQuote
      ? strategy.isWrongNetwork(swapQuote.swapTx.chainId)
      : false;

    const action = useMutation({
      mutationFn: async () => {
        if (!swapQuote) throw new Error("Missing approval data");

        const initialQuoteTime = Date.now();
        initialSubmissionTimeRef.current = initialQuoteTime;

        const fromChainInfo = getChainInfo(swapQuote.inputToken.chainId);
        const toChainInfo = getChainInfo(swapQuote.outputToken.chainId);

        const bridgeTokenDecimals = swapQuote.steps.bridge.tokenIn.decimals;
        const totalBridgeFee = swapQuote.steps.bridge.fees.amount;
        const totalBridgeFeePct = swapQuote.steps.bridge.fees.pct;

        const quote = generateTransferQuoteFromSwapQuote(
          swapQuote,
          fromChainInfo,
          toChainInfo,
          BigNumber.from(0),
          undefined,
          undefined
        );

        const commonTransferProperties = {
          ...quote,
          fromTokenAddress: swapQuote.inputToken.address,
          toTokenAddress: swapQuote.outputToken.address,
          referralProgramAddress: referrer || "",
          externalProjectId: externalProjectNameToId(undefined),
          totalFeePct: formatWeiPct(totalBridgeFeePct)?.toString() || "0",
          totalFeeUsd: ethersUtils.formatUnits(
            totalBridgeFee,
            bridgeTokenDecimals
          ),
        };

        addToAmpliQueue(() => {
          ampli.transferSubmitted({
            ...commonTransferProperties,
            timeFromFirstQuoteToTransferSubmittedInMilliseconds: String(
              Date.now() - initialQuoteTime
            ),
            transferTimestamp: String(Date.now()),
          });
        });

        const txHash = await strategy.execute(swapQuote);

        addToAmpliQueue(() => {
          ampli.transferSigned({
            ...commonTransferProperties,
            timeFromTransferSubmittedToTransferSignedInMilliseconds: String(
              Date.now() - initialQuoteTime
            ),
            transactionHash: txHash,
            capitalFeeTotal: swapQuote.steps.bridge.fees.details
              ? ethersUtils.formatUnits(
                  swapQuote.steps.bridge.fees.details.relayerCapital.amount,
                  bridgeTokenDecimals
                )
              : "0",
            lpFeeTotal: swapQuote.steps.bridge.fees.details
              ? ethersUtils.formatUnits(
                  swapQuote.steps.bridge.fees.details.lp.amount,
                  bridgeTokenDecimals
                )
              : "0",
          });
        });

        const url =
          `/bridge-and-swap/${txHash}?` +
          buildSearchParams({
            originChainId: swapQuote?.inputToken?.chainId || "",
            destinationChainId: swapQuote?.outputToken.chainId || "",
            inputTokenSymbol: swapQuote?.inputToken?.symbol || "",
            outputTokenSymbol: swapQuote?.outputToken?.symbol || "",
            referrer,
            bridgeProvider: swapQuote?.steps.bridge.provider || "across",
          });

        const fromBridgeAndSwapPagePayload =
          createFromBridgeAndSwapPagePayload(swapQuote);
        if (txHash) {
          history.push(url, { fromBridgeAndSwapPagePayload });
        }
        return txHash;
      },
    });

    const buttonDisabled = !swapQuote || (isConnected && action.isPending);

    return {
      isConnected,
      isWrongNetwork,
      buttonActionHandler: action.mutateAsync,
      isButtonActionLoading: action.isPending,
      didActionError: action.isError,
      buttonDisabled,
    };
  };
}
