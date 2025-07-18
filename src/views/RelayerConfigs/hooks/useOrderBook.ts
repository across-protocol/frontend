import { useQuery } from "@tanstack/react-query";
import getApiEndpoint from "utils/serverless-api";

export function useOrderBook(params: {
  originChainId: number;
  destinationChainId: number;
  inputToken?: string;
  outputToken?: string;
}) {
  return useQuery({
    queryKey: ["orderbook", params],
    queryFn: () => {
      if (!params.inputToken || !params.outputToken) {
        throw new Error("Input and output token are required");
      }
      return getApiEndpoint().orderBook({
        originChainId: params.originChainId,
        destinationChainId: params.destinationChainId,
        inputToken: params.inputToken,
        outputToken: params.outputToken,
      });
    },
    refetchInterval: 1000,
    enabled: !!params.inputToken && !!params.outputToken,
  });
}
