import axios from "axios";
import { useQuery } from "react-query";
import { rewardsApiUrl, referralsQueryKey, rewardProgramTypes } from "utils";
import { Deposit } from "./useDeposits";

export interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

export interface GetReferralsResponse {
  pagination: Pagination;
  deposits: Deposit[];
}

const defaultPagination: Pagination = { total: 0, limit: 0, offset: 0 };

export function useReferrals(
  program: rewardProgramTypes,
  account?: string,
  limit?: number,
  offset?: number
) {
  const enabledQuery =
    account !== undefined && limit !== undefined && offset !== undefined;

  const queryKey = enabledQuery
    ? referralsQueryKey(program, account, limit, offset)
    : "DISABLED_REFERRALS_KEY";

  const { data: referrals, ...other } = useQuery(
    queryKey,
    async ({ queryKey: key }) => {
      if (key[0] === "DISABLED_REFERRALS_KEY") return;
      return getReferrals(...key);
    },
    {
      // refetch based on the chain polling interval
      // disable this temporary
      // refetchInterval: 60000,
      enabled: enabledQuery,
      staleTime: 10000, // only eligible to refetch after 10 seconds
    }
  );

  console.log(referrals?.data);

  return {
    referrals: referrals?.data.deposits || [],
    // Note: returning all 0s is a little hacky, but it means that the app won't let the user with the pages while
    // loading. There may be better ways to manage this, maybe with a loading indicator that disables all pagination.
    pagination: referrals?.data.pagination || defaultPagination,
    ...other,
  };
}

/**
 * @param account Address of logged in user.
 * @returns A promise resolving to the referral data of the user
 */
async function getReferrals(
  program: rewardProgramTypes,
  account: string,
  limit: number,
  offset: number
) {
  return axios.get<GetReferralsResponse>(
    `${rewardsApiUrl}/rewards/${program}?userAddress=${account}&limit=${limit}&offset=${offset}`
  );
}
