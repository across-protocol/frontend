import { useQuery } from "@tanstack/react-query";
import { AddressZero } from "@ethersproject/constants";

import {
  getChainInfo,
  getConfig,
  universalSwapQuoteQueryKey,
  UniversalSwapQuoteQueryKeyParams,
} from "utils";
import getApiEndpoint from "utils/serverless-api";

const config = getConfig();

export type UniversalSwapQuote = Awaited<
  ReturnType<typeof useUniversalSwapQuote>
>["data"];

export function useUniversalSwapQuote(
  params: UniversalSwapQuoteQueryKeyParams
) {
  return useQuery({
    enabled: Boolean(
      params.enabled &&
        params.depositorAddress &&
        params.recipientAddress &&
        Number(params.amount) > 0
    ),
    queryKey: universalSwapQuoteQueryKey(params),
    queryFn: ({ queryKey }) => {
      const [
        ,
        {
          amount,
          inputTokenSymbol,
          outputTokenSymbol,
          originChainId,
          destinationChainId,
          tradeType,
          slippageTolerance,
          depositorAddress,
          recipientAddress,
        },
      ] = queryKey;

      const inputToken = config.getTokenInfoBySymbol(
        originChainId,
        inputTokenSymbol
      );
      const outputToken = config.getTokenInfoBySymbol(
        destinationChainId,
        outputTokenSymbol
      );

      if (!inputToken || !outputToken) {
        throw new Error(
          "Can't fetch universal swap quote due to invalid token"
        );
      }

      if (!depositorAddress || !recipientAddress) {
        throw new Error("Depositor or recipient address is required");
      }

      const originChain = getChainInfo(originChainId);
      const destinationChain = getChainInfo(destinationChainId);
      const isInputTokenNative =
        originChain.nativeCurrencySymbol === inputToken.symbol;
      const isOutputTokenNative =
        destinationChain.nativeCurrencySymbol === outputToken.symbol;

      return getApiEndpoint().swapApproval({
        amount,
        inputToken: isInputTokenNative ? AddressZero : inputToken.address,
        outputToken: isOutputTokenNative ? AddressZero : outputToken.address,
        originChainId,
        destinationChainId,
        depositor: depositorAddress,
        recipient: recipientAddress,
        tradeType,
        slippageTolerance,
      });
    },
    refetchInterval: 5_000,
  });
}
