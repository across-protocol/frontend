import { BigNumber } from "ethers";
import { useQuery } from "react-query";

import { getConfig, swapQuoteQueryKey, SwapQuoteQueryKeyParams } from "utils";
import getApiEndpoint from "utils/serverless-api";

const config = getConfig();

export function useSwapQuoteQuery(params: SwapQuoteQueryKeyParams) {
  return useQuery(
    swapQuoteQueryKey(params),
    async ({ queryKey }) => {
      const [
        ,
        swapTokenSymbol,
        acrossInputTokenSymbol,
        acrossOutputTokenSymbol,
        swapTokenAmount,
        originChainId,
        destinationChainId,
        swapSlippage,
      ] = queryKey as [
        string,
        string | undefined,
        string,
        string,
        string,
        number,
        number,
        number
      ];

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

      const swapQuote = await getApiEndpoint().swapQuote({
        swapToken: swapToken.address,
        acrossInputToken: acrossInputToken.address,
        acrossOutputToken: acrossOutputToken.address,
        swapTokenAmount,
        originChainId,
        destinationChainId,
        swapSlippage,
      });

      return swapQuote;
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
