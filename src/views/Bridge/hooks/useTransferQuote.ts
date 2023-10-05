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
import { useAmplitude, useBridgeFees, useBridgeLimits } from "hooks";
import { useCoingeckoPrice } from "hooks/useCoingeckoPrice";
import { ampli } from "ampli";

export function useTransferQuote(
  shouldUpdateQuote: boolean,
  selectedRoute: Route,
  amountToBridge: BigNumber,
  fromAddress?: string,
  toAddress?: string
) {
  const [initialQuoteTime, setInitialQuoteTime] = useState<
    number | undefined
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
    staleTime: shouldUpdateQuote ? undefined : Infinity,
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

      if (!initialQuoteTime) {
        setInitialQuoteTime((s) => s ?? Date.now());
      }

      return {
        estimatedTime,
        quote,
        initialQuoteTime,
        quotedFees: feesQuery.fees,
        quotedLimits: limitsQuery.limits,
        quotePriceUSD: usdPriceQuery.data.price,
      };
    },
    onSuccess: (data) => {
      if (data.quote) {
        addToAmpliQueue(() => {
          ampli.transferQuoteReceived(data.quote);
        });
      }
    },
  });
}
