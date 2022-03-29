import { useQuery } from "react-query";
import { ethers } from "ethers";
import { bridgeFeesQueryKey, getBridgeFees, ChainId } from "utils";
import { useBlock } from "./useBlock";

/**
 * This hook calculates the bridge fees for a given token and amount.
 * @remarks This hook **SHOULD NOT** be used to calculate the fees for a L1 to L2 transfer, as those use canonical bridges instead.
 * @param amount - The amount to check bridge fees for.
 * @param chainId The chain Id of the sending chain, its timestamp will be used to calculate the fees.
 * @param tokenSymbol - The token symbol to check bridge fees for.
 * @returns The bridge fees for the given amount and token symbol and the UseQueryResult object.
 */
export function useBridgeFees(
  amount: ethers.BigNumber,
  fromChain: ChainId,
  tokenSymbol?: string
) {
  const { block } = useBlock(fromChain);
  const enabledQuery = !!fromChain && !!block && !!tokenSymbol && amount.gt(0);
  const queryKey = enabledQuery
    ? bridgeFeesQueryKey(tokenSymbol, amount, fromChain, block.number)
    : "DISABLED_BRIDGE_FEE_QUERY";
  const { data: fees, ...delegated } = useQuery(
    queryKey,
    async () => {
      return getBridgeFees({
        amount,
        tokenSymbol: tokenSymbol!,
        blockTimestamp: block!.timestamp,
      });
    },
    {
      enabled: enabledQuery,
      // We already re-fetch when the block number changes, so we don't need to re-fetch.
      staleTime: Infinity,
    }
  );
  return {
    fees,
    ...delegated,
  };
}
