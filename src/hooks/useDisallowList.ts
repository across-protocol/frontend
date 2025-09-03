import { useQuery } from "@tanstack/react-query";
import { utils } from "ethers";
import { isAddress as isSvmAddress } from "@solana/kit";

const RL_DISALLOW_LIST_URL = (addr: string) =>
  `https://blacklist.risklabs.foundation/api/check/${addr}`;

/**
 * Checks if the account is in the risklabs disallow list
 * @param account - The account to check
 * @returns Whether the account is in the disallow list
 */
export const useDisallowList = (account: string | undefined) => {
  const { data, isLoading } = useQuery({
    queryKey: ["disallowList", account],
    queryFn: async ({ queryKey }) => {
      const [, address] = queryKey;

      if (!address || !utils.isAddress(address) || isSvmAddress(address)) {
        return false;
      }

      const response = await fetch(RL_DISALLOW_LIST_URL(address));
      const data = await response.json();
      return data as boolean;
    },
    enabled: !!account,
  });

  // if the query is loading or the account is not set, return false to
  // avoid blocking the UI otherwise return the result of the query
  return {
    isBlocked: !account || isLoading ? false : data,
    isLoading,
  };
};
