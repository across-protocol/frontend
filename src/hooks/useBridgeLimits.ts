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

/**
 * This hook calculates the limit .
 * @param token The token to get limits for.
 * @param fromChainId The chain id from which the deposit transaction is sent.
 * @param toChainId The chain id where the relay will be sent.
 * @returns The limits datastructure returned from the serverless api.
 */
export function useBridgeLimits(
  tokenSymbol?: string,
  fromChainId?: ChainId,
  toChainId?: ChainId
) {
  const enabledQuery =
    tokenSymbol !== undefined &&
    toChainId !== undefined &&
    fromChainId !== undefined;
  const queryKey = enabledQuery
    ? bridgeLimitsQueryKey(tokenSymbol, fromChainId, toChainId)
    : "DISABLED_BRIDGE_LIMITS_QUERY";
  const { data: limits, ...delegated } = useQuery(
    queryKey,
    () => {
      if (!tokenSymbol || !fromChainId || !toChainId) {
        return;
      }
      const token = getConfig().getTokenInfoBySymbol(fromChainId, tokenSymbol);
      return getApiEndpoint().limits(token.address, fromChainId!, toChainId!);
    },
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
