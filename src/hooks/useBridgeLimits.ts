import { useQuery } from "@tanstack/react-query";
import { bridgeLimitsQueryKey, ChainId, getConfig } from "utils";
import { BigNumber } from "ethers";
import getApiEndpoint from "utils/serverless-api";
import { UniversalSwapQuote } from "./useUniversalSwapQuote";

export interface BridgeLimits {
  minDeposit: BigNumber;
  maxDeposit: BigNumber;
  maxDepositInstant: BigNumber;
  maxDepositShortDelay: BigNumber;
}

const config = getConfig();

/**
 * This hook calculates the limit .
 * @param inputTokenSymbol The input token to get limits for.
 * @param outputTokenSymbol The output token to get limits for.
 * @param fromChainId The chain id from which the deposit transaction is sent.
 * @param toChainId The chain id where the relay will be sent.
 * @returns The limits datastructure returned from the serverless api.
 */
export function useBridgeLimits(
  inputTokenSymbol?: string,
  outputTokenSymbol?: string,
  fromChainId?: ChainId,
  toChainId?: ChainId,
  isUniversalSwap?: boolean,
  universalSwapQuote?: UniversalSwapQuote,
  enabled: boolean = true
) {
  const queryEnabled =
    enabled &&
    !!(
      inputTokenSymbol &&
      outputTokenSymbol &&
      fromChainId &&
      toChainId &&
      (isUniversalSwap ? !!universalSwapQuote : true)
    );
  const didUniversalSwapLoad = isUniversalSwap && !!universalSwapQuote;
  const bridgeInputTokenSymbol = didUniversalSwapLoad
    ? universalSwapQuote.steps.bridge.tokenIn.symbol
    : inputTokenSymbol;
  const bridgeOutputTokenSymbol = didUniversalSwapLoad
    ? universalSwapQuote.steps.bridge.tokenOut.symbol
    : outputTokenSymbol;
  const queryKey = bridgeLimitsQueryKey(
    bridgeInputTokenSymbol,
    bridgeOutputTokenSymbol,
    fromChainId,
    toChainId
  );
  const { data: limits, ...delegated } = useQuery({
    queryKey,
    queryFn: ({ queryKey }) => {
      const [
        ,
        inputTokenSymbolToQuery,
        outputTokenSymbolToQuery,
        fromChainIdToQuery,
        toChainIdToQuery,
      ] = queryKey;

      if (
        !inputTokenSymbolToQuery ||
        !outputTokenSymbolToQuery ||
        !fromChainIdToQuery ||
        !toChainIdToQuery
      ) {
        throw new Error("Bridge limits query not enabled");
      }

      return getApiEndpoint().limits(
        config.getTokenInfoBySymbol(fromChainIdToQuery, inputTokenSymbolToQuery)
          .address,
        config.getTokenInfoBySymbol(toChainIdToQuery, outputTokenSymbolToQuery)
          .address,
        fromChainIdToQuery,
        toChainIdToQuery
      );
    },
    enabled: queryEnabled,
    refetchInterval: 300_000, // 5 minutes
  });
  return {
    limits,
    ...delegated,
  };
}
