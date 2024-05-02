import { useQuery } from "react-query";
import { bridgeLimitsQueryKey, ChainId, getConfig } from "utils";
import { BigNumber } from "ethers";
import getApiEndpoint from "utils/serverless-api";

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
  inputTokenSymbol: string,
  outputTokenSymbol: string,
  fromChainId: ChainId,
  toChainId: ChainId
) {
  const { data: limits, ...delegated } = useQuery(
    bridgeLimitsQueryKey(
      inputTokenSymbol,
      outputTokenSymbol,
      fromChainId,
      toChainId
    ),
    () => {
      return getApiEndpoint().limits(
        config.getTokenInfoBySymbol(fromChainId, inputTokenSymbol).address,
        config.getTokenInfoBySymbol(toChainId, outputTokenSymbol).address,
        fromChainId,
        toChainId
      );
    },
    {
      refetchInterval: 300_000,
    }
  );
  return {
    limits,
    ...delegated,
  };
}
