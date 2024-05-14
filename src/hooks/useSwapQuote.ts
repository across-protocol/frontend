import { BigNumber } from "ethers";
import { useQuery } from "react-query";

import { getConfig, swapQuoteQueryKey, SwapQuoteQueryKeyParams } from "utils";
import getApiEndpoint from "utils/serverless-api";

const config = getConfig();

export function useSwapQuoteQuery(params: SwapQuoteQueryKeyParams) {
  return useQuery(
    swapQuoteQueryKey(params),
    ({ queryKey }) => {
      const [
        ,
        {
          swapTokenSymbol,
          acrossInputTokenSymbol,
          acrossOutputTokenSymbol,
          swapTokenAmount,
          originChainId,
          destinationChainId,
          swapSlippage,
        },
      ] = queryKey;

      if (
        !swapTokenSymbol ||
        !isSwapRoute(originChainId, destinationChainId, swapTokenSymbol)
      ) {
        return undefined;
      }

      const swapToken = config.getTokenInfoBySymbol(
        originChainId,
        swapTokenSymbol
      );
      const acrossInputToken = config.getTokenInfoBySymbol(
        originChainId,
        acrossInputTokenSymbol
      );
      const acrossOutputToken = config.getTokenInfoBySymbol(
        destinationChainId,
        acrossOutputTokenSymbol
      );

      if (
        !swapToken ||
        !acrossInputToken ||
        !acrossOutputToken ||
        BigNumber.from(swapTokenAmount).lte(0)
      ) {
        return undefined;
      }

      return getApiEndpoint().swapQuote({
        swapToken: swapToken.address,
        acrossInputToken: acrossInputToken.address,
        acrossOutputToken: acrossOutputToken.address,
        swapTokenAmount,
        originChainId,
        destinationChainId,
        swapSlippage,
      });
    },
    {
      enabled: !!params.swapTokenSymbol,
      refetchInterval: 60_000,
    }
  );
}

export function isSwapRoute(
  originChainId: number,
  destinationChainId: number,
  swapTokenSymbol: string
) {
  return !!getConfig()
    .getSwapRoutes()
    .find(
      (route) =>
        route.fromChain === originChainId &&
        route.swapTokenSymbol === swapTokenSymbol &&
        route.toChain === destinationChainId
    );
}
