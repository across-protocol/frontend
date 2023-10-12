import { useState } from "react";
import { BigNumber } from "ethers";
import { useQuery } from "react-query";

import {
  getToken,
  getChainInfo,
  generateTransferQuote,
  getConfirmationDepositTime,
  Route,
} from "utils";
import { useBridgeFees, useBridgeLimits } from "hooks";
import { useCoingeckoPrice } from "hooks/useCoingeckoPrice";

export function useTransferQuote(
  selectedRoute: Route,
  amountToBridge: BigNumber,
  fromAddress?: string,
  toAddress?: string
) {
  const [initialQuoteTime, setInitialQuoteTime] = useState<
    number | undefined
  >();

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

  return useQuery({
    queryKey: [
      "quote",
      feesQuery.fees?.quoteBlock.toString(),
      selectedRoute.fromChain,
      selectedRoute.toChain,
      selectedRoute.fromTokenSymbol,
      amountToBridge.toString(),
    ],
    enabled: Boolean(
      feesQuery.fees && limitsQuery.limits && usdPriceQuery.data?.price
    ),
    queryFn: async () => {
      if (
        !feesQuery.fees ||
        !limitsQuery.limits ||
        !usdPriceQuery.data?.price ||
        amountToBridge.lte(0)
      ) {
        return {
          estimatedTime: undefined,
          quote: undefined,
          initialQuoteTime: undefined,
          quotedFees: undefined,
          quotedLimits: undefined,
          quotePriceUSD: undefined,
        };
      }

      const tokenInfo = getToken(selectedRoute.fromTokenSymbol);
      const fromChainInfo = getChainInfo(selectedRoute.fromChain);
      const toChainInfo = getChainInfo(selectedRoute.toChain);
      const estimatedTime = getConfirmationDepositTime(
        amountToBridge,
        limitsQuery.limits,
        selectedRoute.toChain,
        selectedRoute.fromChain
      );
      const quote = generateTransferQuote(
        feesQuery.fees,
        selectedRoute,
        tokenInfo,
        fromChainInfo,
        toChainInfo,
        usdPriceQuery.data.price,
        estimatedTime,
        amountToBridge,
        fromAddress,
        toAddress
      );

      let initialQuoteTimeToUse = initialQuoteTime || Date.now();

      if (!initialQuoteTime) {
        setInitialQuoteTime((s) => s ?? initialQuoteTimeToUse);
      }

      return {
        estimatedTime,
        quote,
        initialQuoteTime: initialQuoteTimeToUse,
        quotedFees: feesQuery.fees,
        quotedLimits: limitsQuery.limits,
        quotePriceUSD: usdPriceQuery.data.price,
      };
    },
  });
}
