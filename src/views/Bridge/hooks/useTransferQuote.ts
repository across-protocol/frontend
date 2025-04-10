import { useState } from "react";
import { BigNumber } from "ethers";
import { useQuery } from "@tanstack/react-query";

import {
  getToken,
  getChainInfo,
  generateTransferQuote,
  getConfirmationDepositTime,
} from "utils";
import { useBridgeFees, useBridgeLimits } from "hooks";
import { useCoingeckoPrice } from "hooks/useCoingeckoPrice";
import { useSwapQuoteQuery } from "hooks/useSwapQuote";
import { SelectedRoute } from "../utils";
import { useUniversalSwapQuote } from "hooks/useUniversalSwapQuote";

const DEFAULT_UNIVERSAL_SWAP_QUOTE_EOA =
  "0xBb23Cd0210F878Ea4CcA50e9dC307fb0Ed65Cf6B";

export type TransferQuote = ReturnType<
  typeof useTransferQuote
>["transferQuoteQuery"]["data"];

export function useTransferQuote(
  selectedRoute: SelectedRoute,
  amount: BigNumber,
  swapSlippage: number,
  fromAddress?: string,
  toAddress?: string
) {
  const [initialQuoteTime, setInitialQuoteTime] = useState<
    number | undefined
  >();
  const isSwapRoute = selectedRoute.type === "swap";
  const isUniversalSwapRoute = selectedRoute.type === "universal-swap";
  const swapQuoteQuery = useSwapQuoteQuery({
    // Setting `swapTokenSymbol` to undefined will disable the query
    swapTokenSymbol: isSwapRoute ? selectedRoute.swapTokenSymbol : undefined,
    acrossInputTokenSymbol: selectedRoute.fromTokenSymbol,
    acrossOutputTokenSymbol: selectedRoute.toTokenSymbol,
    swapTokenAmount: amount.toString(),
    originChainId: selectedRoute.fromChain,
    destinationChainId: selectedRoute.toChain,
    swapSlippage,
  });
  const universalSwapQuoteQuery = useUniversalSwapQuote({
    enabled: isUniversalSwapRoute,
    amount: amount.toString(),
    inputTokenSymbol: selectedRoute.fromTokenSymbol,
    outputTokenSymbol: selectedRoute.toTokenSymbol,
    originChainId: selectedRoute.fromChain,
    destinationChainId: selectedRoute.toChain,
    tradeType: "exactInput",
    slippageTolerance: swapSlippage,
    depositorAddress: fromAddress ?? DEFAULT_UNIVERSAL_SWAP_QUOTE_EOA,
    recipientAddress: toAddress ?? DEFAULT_UNIVERSAL_SWAP_QUOTE_EOA,
  });
  const amountToBridgeAfterSwap = getBridgeAmountAfterSwap({
    amount,
    isSwapRoute,
    swapQuoteQuery,
    isUniversalSwapRoute,
    universalSwapQuoteQuery,
  });

  const feesQuery = useBridgeFees(
    amountToBridgeAfterSwap,
    selectedRoute.fromChain,
    selectedRoute.toChain,
    selectedRoute.fromTokenSymbol,
    selectedRoute.toTokenSymbol,
    selectedRoute.externalProjectId,
    toAddress,
    isUniversalSwapRoute,
    universalSwapQuoteQuery.data
  );
  const limitsQuery = useBridgeLimits(
    selectedRoute.fromTokenSymbol,
    selectedRoute.toTokenSymbol,
    selectedRoute.fromChain,
    selectedRoute.toChain,
    isUniversalSwapRoute,
    universalSwapQuoteQuery.data
  );
  const usdPriceQuery = useCoingeckoPrice(selectedRoute.l1TokenAddress, "usd");

  const transferQuoteQuery = useQuery({
    queryKey: [
      "quote",
      selectedRoute.fromChain,
      selectedRoute.toChain,
      isSwapRoute
        ? selectedRoute.swapTokenSymbol
        : selectedRoute.fromTokenSymbol,
      selectedRoute.toTokenSymbol,
      amount.toString(),
      swapSlippage,
      toAddress,
      selectedRoute.externalProjectId,
      selectedRoute.type,
    ],
    enabled: Boolean(
      feesQuery.fees &&
        limitsQuery.limits &&
        usdPriceQuery.data?.price &&
        // If it's a swap route, we also need to wait for the swap quote to be fetched
        (!isSwapRoute && !isUniversalSwapRoute
          ? true
          : isSwapRoute
            ? swapQuoteQuery.data
            : isUniversalSwapRoute
              ? universalSwapQuoteQuery.data
              : true)
    ),
    queryFn: async () => {
      if (
        !feesQuery.fees ||
        !limitsQuery.limits ||
        !usdPriceQuery.data?.price ||
        // If it's a swap route, we also need to wait for the swap quote to be fetched
        (isSwapRoute ? !swapQuoteQuery.data : false) ||
        (isUniversalSwapRoute ? !universalSwapQuoteQuery.data : false)
      ) {
        return {
          estimatedTime: undefined,
          quote: undefined,
          initialQuoteTime: undefined,
          quotedFees: undefined,
          quotedLimits: undefined,
          quotePriceUSD: undefined,
          quotedSwap: undefined,
          quotedUniversalSwap: undefined,
          amountToBridgeAfterSwap: undefined,
          initialAmount: undefined,
          recipient: undefined,
          exclusiveRelayer: undefined,
          exclusivityDeadline: undefined,
        };
      }

      const tokenInfo = getToken(selectedRoute.fromTokenSymbol);
      const fromChainInfo = getChainInfo(selectedRoute.fromChain);
      const toChainInfo = getChainInfo(selectedRoute.toChain);
      const estimatedTime = getConfirmationDepositTime(
        selectedRoute.fromChain,
        feesQuery.fees.estimatedFillTimeSec
      );
      const quoteForAnalytics = generateTransferQuote(
        feesQuery.fees,
        selectedRoute,
        tokenInfo,
        fromChainInfo,
        toChainInfo,
        usdPriceQuery.data.price,
        estimatedTime,
        amountToBridgeAfterSwap,
        fromAddress,
        toAddress
      );

      let initialQuoteTimeToUse = initialQuoteTime || Date.now();

      if (!initialQuoteTime) {
        setInitialQuoteTime((s) => s ?? initialQuoteTimeToUse);
      }

      return {
        estimatedTime,
        quoteForAnalytics,
        initialQuoteTime: initialQuoteTimeToUse,
        quotedFees: feesQuery.fees,
        quotedLimits: limitsQuery.limits,
        quotePriceUSD: usdPriceQuery.data.price,
        quotedSwap: isSwapRoute ? swapQuoteQuery.data : undefined,
        quotedUniversalSwap: isUniversalSwapRoute
          ? universalSwapQuoteQuery.data
          : undefined,
        amountToBridgeAfterSwap,
        initialAmount: amount,
        recipient: toAddress,
        exclusiveRelayer: feesQuery.fees.exclusiveRelayer,
        exclusivityDeadline: feesQuery.fees.exclusivityDeadline,
      };
    },
  });

  return {
    transferQuoteQuery,
    limitsQuery,
    feesQuery,
    swapQuoteQuery,
    universalSwapQuoteQuery,
    usdPriceQuery,
  };
}

function getBridgeAmountAfterSwap({
  amount,
  isSwapRoute,
  swapQuoteQuery,
  isUniversalSwapRoute,
  universalSwapQuoteQuery,
}: {
  amount: BigNumber;
  isSwapRoute: boolean;
  swapQuoteQuery: ReturnType<typeof useSwapQuoteQuery>;
  isUniversalSwapRoute: boolean;
  universalSwapQuoteQuery: ReturnType<typeof useUniversalSwapQuote>;
}) {
  if (isSwapRoute) {
    if (
      swapQuoteQuery.isLoading ||
      !swapQuoteQuery.data?.minExpectedInputTokenAmount
    ) {
      return BigNumber.from(0);
    }

    return BigNumber.from(swapQuoteQuery.data.minExpectedInputTokenAmount);
  }

  if (isUniversalSwapRoute) {
    if (universalSwapQuoteQuery.isLoading || !universalSwapQuoteQuery.data) {
      return BigNumber.from(0);
    }

    return BigNumber.from(
      universalSwapQuoteQuery.data.steps.bridge.inputAmount
    );
  }

  return amount;
}
