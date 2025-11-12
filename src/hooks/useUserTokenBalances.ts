import { useQuery } from "@tanstack/react-query";
import { UserTokenBalancesResponse } from "utils/serverless-api/types";
import getApiEndpoint from "utils/serverless-api";
import { useConnectionEVM } from "./useConnectionEVM";
import { useConnectionSVM } from "./useConnectionSVM";

export function useUserTokenBalances() {
  const { account: evmAccount } = useConnectionEVM();
  const { account: svmAccount } = useConnectionSVM();

  // Convert SVM PublicKey to string if it exists
  const svmAccountString = svmAccount?.toString();

  return useQuery({
    queryKey: makeUseUserTokenBalancesQueryKey([evmAccount, svmAccountString]),
    queryFn: async (): Promise<UserTokenBalancesResponse> => {
      // Fetch balances for both accounts if they exist
      const promises: Promise<UserTokenBalancesResponse>[] = [];

      if (evmAccount) {
        promises.push(getApiEndpoint().userTokenBalances(evmAccount));
      }

      if (svmAccountString) {
        promises.push(getApiEndpoint().userTokenBalances(svmAccountString));
      }

      if (promises.length === 0) {
        throw new Error("No account connected");
      }

      // Fetch all balances in parallel
      const results = await Promise.all(promises);

      // Merge the results
      if (results.length === 1) {
        return results[0];
      }

      // Merge balances from both EVM and SVM accounts
      return {
        account: evmAccount || svmAccountString || "",
        balances: results.flatMap((result) => result.balances),
      };
    },
    enabled: !!evmAccount || !!svmAccountString,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 3 * 60 * 1000, // Consider data stale after 3 minutes
  });
}

export const makeUseUserTokenBalancesQueryKey = (
  keys?: Parameters<typeof useQuery>[0]["queryKey"]
) => ["userTokenBalances", ...(keys ? keys : [])];
