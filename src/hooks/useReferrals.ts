import axios from "axios";
import { useQuery } from "react-query";
import { rewardsApiUrl, referralsQueryKey } from "utils";

export interface Referral {
  depositTxHash: string;
  sourceChainId: number;
  destinationChainId: number;
  amount: string;
  symbol: string;
  decimals: number;
  depositorAddr: string;
  referralAddress: string;
  depositDate: string;
  realizedLpFeeUsd?: number;
  bridgeFeeUsd?: number;
  referralRate: number;
  acxRewards: string;
}

export interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

export interface GetReferralsResponse {
  pagination: Pagination;
  referrals: Referral[];
}

const defaultPagination: Pagination = { total: 0, limit: 0, offset: 0 };

export function useReferrals(
  account?: string,
  limit?: number,
  offset?: number
) {
  const enabledQuery =
    account !== undefined && limit !== undefined && offset !== undefined;

  const queryKey = enabledQuery
    ? referralsQueryKey(account, limit, offset)
    : "DISABLED_REFERRALS_KEY";

  const { data: referrals, ...other } = useQuery(
    queryKey,
    async ({ queryKey: key }) => {
      if (key[0] === "DISABLED_REFERRALS_KEY") return;
      const query = key as [string, string, number, number];
      return getReferrals(query[1], query[2], query[3]);
    },
    {
      // refetch based on the chain polling interval
      // disable this temporary
      // refetchInterval: 60000,
      enabled: enabledQuery,
      staleTime: 10000, // only eligible to refetch after 10 seconds
    }
  );

  return {
    referrals: referrals?.data.referrals || [],
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
async function getReferrals(account: string, limit: number, offset: number) {
  return axios.get<GetReferralsResponse>(
    `${rewardsApiUrl}/referrals/details?address=${account}&limit=${limit}&offset=${offset}`
  );
}
