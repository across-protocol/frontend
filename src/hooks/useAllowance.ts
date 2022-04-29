import { useQuery } from "react-query";
import { useConnection } from "state/hooks";
import { allowanceQueryKey, getAllowance, ChainId } from "utils";
import { useBlock } from "./useBlock";
import { BigNumber } from "ethers";

/**
 *
 * @param token  The token to fetch the allowance of.
 * @param chainId The chain Id of the chain to execute the query on.
 * @param owner  The owner in the allowance call.
 * @param spender The spender in the allowance call.
 * @param blockNumber The block number to execute the query on.
 * @remarks Passing the zero address as token will return infinite allowance. Passing no account will return the allowance of the connecte` account for the `spender`.
 * @returns The allowance of tokens granted by the `owner` to the `spender` and the and the UseQueryResult object
 */
export function useAllowance(
  tokenSymbol?: string,
  chainId?: ChainId,
  owner?: string,
  spender?: string,
  blockNumber?: number
) {
  const { account: connectedAccount } = useConnection();
  const chainIdToQuery = chainId;
  const ownerToQuery = owner ?? connectedAccount;
  const { block: latestBlock } = useBlock(chainId);
  const blockNumberToQuery = blockNumber ?? latestBlock?.number;
  const enabledQuery =
    !!chainIdToQuery &&
    !!ownerToQuery &&
    !!spender &&
    !!blockNumberToQuery &&
    !!tokenSymbol;
  const queryKey = enabledQuery
    ? allowanceQueryKey(
        ownerToQuery,
        spender,
        blockNumberToQuery,
        chainIdToQuery,
        tokenSymbol
      )
    : [
        "DISABLED_ALLOWANCE_QUERY",
        {
          chainIdToQuery,
          tokenSymbol,
          ownerToQuery,
          spender,
          blockNumberToQuery,
        },
      ];
  const { data: allowance, ...delegated } = useQuery(
    queryKey,
    async () => {
      if (!chainIdToQuery || !tokenSymbol) return BigNumber.from(0);
      return getAllowance(
        chainIdToQuery,
        ownerToQuery!,
        spender!,
        tokenSymbol,
        blockNumberToQuery
      );
    },
    {
      enabled: enabledQuery,
      // We already re-fetch when the block number changes, so we don't need to re-fetch.
      staleTime: Infinity,
    }
  );
  return {
    allowance,
    ...delegated,
  };
}
