import { useQuery } from "react-query";
import { ethers } from "ethers";
import { bridgeFeesQueryKey, getBridgeFees, ChainId } from "utils";

/**
 * This hook calculates the bridge fees for a given token and amount.
 * @param amount - The amount to check bridge fees for.
 * @param fromChainId The chain Id of the origin chain
 * @param toChainId The chain Id of the receiving chain, its timestamp will be used to calculate the fees.
 * @param tokenSymbol - The token symbol to check bridge fees for.
 * @returns The bridge fees for the given amount and token symbol and the UseQueryResult object.
 */
export function useBridgeFees(
  amount: ethers.BigNumber,
  fromChainId?: ChainId,
  toChainId?: ChainId,
  tokenSymbol?: string,
  recipientAddress?: string
) {
  const enabledQuery =
    !!toChainId && !!fromChainId && !!tokenSymbol && amount.gt(0);
  const queryKey = enabledQuery
    ? bridgeFeesQueryKey(tokenSymbol, amount, fromChainId, toChainId)
    : "DISABLED_BRIDGE_FEE_QUERY";
  const { data: fees, ...delegated } = useQuery(
    queryKey,
    async () => {
      return getBridgeFees({
        amount,
        tokenSymbol: tokenSymbol!,
        toChainId: toChainId!,
        fromChainId: fromChainId!,
        recipientAddress,
      });
    },
    {
      enabled: enabledQuery,
      refetchInterval: 5000,
    }
  );
  return {
    fees,
    ...delegated,
  };
}
