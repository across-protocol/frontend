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
    queryKey: ["userTokenBalances", evmAccount, svmAccountString],
    queryFn: async (): Promise<UserTokenBalancesResponse> => {
      // If no accounts are connected, return empty balances to clear stale data
      if (!evmAccount && !svmAccountString) {
        return {
          account: "",
          balances: [],
        };
      }

      // Fetch balances for both accounts if they exist
      const promises: Promise<UserTokenBalancesResponse>[] = [];

      if (evmAccount) {
        promises.push(getApiEndpoint().userTokenBalances(evmAccount));
      }

      if (svmAccountString) {
        promises.push(getApiEndpoint().userTokenBalances(svmAccountString));
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
    // Always enable the query so it refetches when wallets disconnect and clears stale data
    refetchInterval: 60 * 1000, // Refetch every minute
    staleTime: 60 * 1000 * 0.8, // Consider data stale after 80% of refetch interval (48 seconds)
  });
}

export const makeUseUserTokenBalancesQueryKey = (
  keys?: Parameters<typeof useQuery>[0]["queryKey"]
) => ["userTokenBalances", ...(keys ? keys : [])];
