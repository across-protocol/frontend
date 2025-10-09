import { useQuery } from "@tanstack/react-query";
import { useConnection } from "./useConnection";
import { UserTokenBalancesResponse } from "utils/serverless-api/types";
import getApiEndpoint from "utils/serverless-api";

export function useUserTokenBalances() {
  const { account } = useConnection();

  return useQuery({
    queryKey: ["userTokenBalances", account],
    queryFn: async (): Promise<UserTokenBalancesResponse> => {
      if (!account) {
        throw new Error("No account connected");
      }
      return await getApiEndpoint().userTokenBalances(account);
    },
    enabled: !!account,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 3 * 60 * 1000, // Consider data stale after 3 minutes
  });
}
