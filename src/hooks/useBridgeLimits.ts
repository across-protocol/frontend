import { useQuery } from "react-query";
import { bridgeLimitsQueryKey, ChainId } from "utils";
import axios from "axios";
import { BigNumber } from "ethers";

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
    async (): Promise<BridgeLimits> => {
      const response = (
        await axios.get(
          `/api/limits?token=${token}&originChainId=${fromChainId}&destinationChainId=${toChainId}`
        )
      ).data;
      console.log(response);
      return {
        minDeposit: BigNumber.from(response.minDeposit),
        maxDeposit: BigNumber.from(response.maxDeposit),
        maxDepositInstant: BigNumber.from(response.maxDepositInstant),
        maxDepositShortDelay: BigNumber.from(response.maxDepositShortDelay),
      };
    },
    {
      enabled: enabledQuery,
      // 5 mins.
      staleTime: 300000,
    }
  );
  return {
    limits,
    ...delegated,
  };
}
