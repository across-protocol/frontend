import { useQuery } from "react-query";
import { bridgeLimitsQueryKey, ChainId } from "utils";
import { BigNumber } from "ethers";
import getApiEndpoint from "utils/serverless-api";

export interface BridgeLimits {
  minDeposit: BigNumber;
  maxDeposit: BigNumber;
  maxDepositInstant: BigNumber;
  maxDepositShortDelay: BigNumber;
}

/**
 * This hook calculates the limit .
 * @param token The token to get limits for.
 * @param fromChainId The chain id from which the deposit transaction is sent.
 * @param toChainId The chain id where the relay will be sent.
 * @returns The limits datastructure returned from the serverless api.
 */
export function useBridgeLimits(
  token?: string,
  fromChainId?: ChainId,
  toChainId?: ChainId
) {
  const enabledQuery =
    token !== undefined && toChainId !== undefined && fromChainId !== undefined;
  const queryKey = enabledQuery
    ? bridgeLimitsQueryKey(token, fromChainId, toChainId)
    : "DISABLED_BRIDGE_LIMITS_QUERY";
  const { data: limits, ...delegated } = useQuery(
    queryKey,
    async () => getApiEndpoint().limits(token!, fromChainId!, toChainId!),
    {
      enabled: enabledQuery,
      // 5 mins.
      staleTime: 300000,
      retry: 2,
    }
  );
  return {
    limits,
    ...delegated,
  };
}
