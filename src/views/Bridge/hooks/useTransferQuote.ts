import { useEffect, useState } from "react";
import { BigNumber } from "ethers";

import {
  GetBridgeFeesResult,
  getToken,
  getChainInfo,
  generateTransferQuote,
  ConfirmationDepositTimeType,
  getConfirmationDepositTime,
  Route,
} from "utils";
import { BridgeLimitInterface } from "utils/serverless-api/types";
import { useAmplitude, useBridgeFees, useBridgeLimits } from "hooks";
import { useCoingeckoPrice } from "hooks/useCoingeckoPrice";
import { ampli, TransferQuoteReceivedProperties } from "ampli";

export function useTransferQuote(
  selectedRoute: Route,
  amountToBridge: BigNumber,
  fromAddress?: string,
  toAddress?: string,
  shouldUpdateQuote?: boolean
) {
  const [quotedFees, setQuotedFees] = useState<
    GetBridgeFeesResult | undefined
  >();
  const [quotedLimits, setQuotedLimits] = useState<
    BridgeLimitInterface | undefined
  >();
  const [quotePriceUSD, setQuotedPriceUSD] = useState<BigNumber | undefined>();
  const [quote, setQuote] = useState<
    TransferQuoteReceivedProperties | undefined
  >();
  const [initialQuoteTime, setInitialQuoteTime] = useState<
    number | undefined
  >();
  const [estimatedTime, setEstimatedTime] = useState<
    ConfirmationDepositTimeType | undefined
  >();

  const { addToAmpliQueue } = useAmplitude();

  const feesQuery = useBridgeFees(
    amountToBridge,
    selectedRoute.fromChain,
    selectedRoute.toChain,
    selectedRoute.fromTokenSymbol
  );
  const limitsQuery = useBridgeLimits(
    selectedRoute.fromTokenSymbol,
    selectedRoute.fromChain,
    selectedRoute.toChain
  );
  const usdPriceQuery = useCoingeckoPrice(selectedRoute.l1TokenAddress, "usd");

  useEffect(() => {
    if (shouldUpdateQuote || !quotedFees) {
      setQuotedFees(feesQuery.fees);
    }
    if (shouldUpdateQuote || !quotedLimits) {
      setQuotedLimits(limitsQuery.limits);
    }
    if (shouldUpdateQuote || !quotePriceUSD) {
      setQuotedPriceUSD(usdPriceQuery.data?.price);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    feesQuery.fees,
    limitsQuery.limits,
    usdPriceQuery.data,
    shouldUpdateQuote,
  ]);

  useEffect(() => {
    if (quotedLimits && amountToBridge.gt(0)) {
      setEstimatedTime(
        getConfirmationDepositTime(
          amountToBridge,
          quotedLimits,
          selectedRoute.toChain,
          selectedRoute.fromChain
        )
      );
    }
  }, [
    amountToBridge,
    quotedLimits,
    selectedRoute.fromChain,
    selectedRoute.toChain,
  ]);

  useEffect(() => {
    if (
      quotedFees &&
      fromAddress &&
      toAddress &&
      usdPriceQuery?.data?.price &&
      estimatedTime &&
      amountToBridge
    ) {
      const tokenInfo = getToken(selectedRoute.fromTokenSymbol);
      const fromChainInfo = getChainInfo(selectedRoute.fromChain);
      const toChainInfo = getChainInfo(selectedRoute.toChain);
      const quote = generateTransferQuote(
        quotedFees,
        selectedRoute,
        tokenInfo,
        fromChainInfo,
        toChainInfo,
        toAddress,
        fromAddress,
        usdPriceQuery.data.price,
        estimatedTime,
        amountToBridge
      );
      addToAmpliQueue(() => {
        ampli.transferQuoteReceived(quote);
      });
      setQuote(quote);
      setInitialQuoteTime((s) => s ?? Date.now());
    }
  }, [
    quotedFees,
    selectedRoute,
    amountToBridge,
    fromAddress,
    toAddress,
    usdPriceQuery?.data?.price,
    estimatedTime,
    addToAmpliQueue,
  ]);

  return {
    estimatedTime,
    quote,
    initialQuoteTime,
    quotedFees,
    quotedLimits,
    quotePriceUSD,
    isQuoteLoading:
      feesQuery.isLoading || limitsQuery.isLoading || usdPriceQuery.isLoading,
  };
}
