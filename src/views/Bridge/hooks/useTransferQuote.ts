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
  const amountToBridgeAfterSwap = getBridgeAmountAfterSwap(
    amount,
    isSwapRoute,
    swapQuoteQuery
  );

  const feesQuery = useBridgeFees(
    amountToBridgeAfterSwap,
    selectedRoute.fromChain,
    selectedRoute.toChain,
    selectedRoute.fromTokenSymbol,
    selectedRoute.toTokenSymbol,
    toAddress
  );
  const limitsQuery = useBridgeLimits(
    selectedRoute.fromTokenSymbol,
    selectedRoute.toTokenSymbol,
    selectedRoute.fromChain,
    selectedRoute.toChain
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
    ],
    enabled: Boolean(
      feesQuery.fees &&
        limitsQuery.limits &&
        usdPriceQuery.data?.price &&
        // If it's a swap route, we also need to wait for the swap quote to be fetched
        (isSwapRoute ? swapQuoteQuery.data : true)
    ),
    queryFn: async () => {
      if (
        !feesQuery.fees ||
        !limitsQuery.limits ||
        !usdPriceQuery.data?.price ||
        // If it's a swap route, we also need to wait for the swap quote to be fetched
        (isSwapRoute ? !swapQuoteQuery.data : false)
      ) {
        return {
          estimatedTime: undefined,
          quote: undefined,
          initialQuoteTime: undefined,
          quotedFees: undefined,
          quotedLimits: undefined,
          quotePriceUSD: undefined,
          quotedSwap: undefined,
          amountToBridgeAfterSwap: undefined,
          initialAmount: undefined,
          recipient: undefined,
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
        amountToBridgeAfterSwap,
        initialAmount: amount,
        recipient: toAddress,
      };
    },
  });

  return {
    transferQuoteQuery,
    limitsQuery,
    feesQuery,
    swapQuoteQuery,
    usdPriceQuery,
  };
}

function getBridgeAmountAfterSwap(
  amountToBridge: BigNumber,
  isSwapRoute: boolean,
  swapQuoteQuery: ReturnType<typeof useSwapQuoteQuery>
) {
  if (!isSwapRoute) {
    return amountToBridge;
  }

  if (
    swapQuoteQuery.isLoading ||
    !swapQuoteQuery.data?.minExpectedInputTokenAmount
  ) {
    return BigNumber.from(0);
  }

  return BigNumber.from(swapQuoteQuery.data.minExpectedInputTokenAmount);
}
