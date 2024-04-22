import { useQuery } from "react-query";
import { BigNumber, ethers } from "ethers";
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
  const queryKey = bridgeFeesQueryKey(
    amount,
    tokenSymbol,
    fromChainId,
    toChainId
  );
  const { data: fees, ...delegated } = useQuery(
    queryKey,
    ({ queryKey }) => {
      const [
        ,
        tokenSymbolToQuery,
        amountToQuery,
        fromChainIdToQuery,
        toChainIdToQuery,
      ] = queryKey;

      if (!toChainIdToQuery || !fromChainIdToQuery || !tokenSymbolToQuery) {
        return undefined;
      }

      return getBridgeFees({
        amount: BigNumber.from(amountToQuery),
        tokenSymbol: tokenSymbolToQuery,
        toChainId: toChainIdToQuery,
        fromChainId: toChainIdToQuery,
        recipientAddress,
      });
    },
    {
      enabled: Boolean(toChainId && fromChainId && tokenSymbol && amount.gt(0)),
      refetchInterval: 5000,
    }
  );
  return {
    fees,
    ...delegated,
  };
}
