import axios from "axios";
import { useQuery } from "react-query";
import {
  rewardsApiUrl,
  rewardsQueryKey,
  rewardProgramTypes,
  parseUnitsWithExtendedDecimals,
} from "utils";
import { Deposit } from "./useDeposits";

export interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

export interface GetRewardsResponse {
  pagination: Pagination;
  deposits: Deposit[];
}

const defaultPagination: Pagination = { total: 0, limit: 0, offset: 0 };

export function useRewards(
  program: rewardProgramTypes,
  account?: string,
  limit?: number,
  offset?: number
) {
  const enabledQuery =
    account !== undefined && limit !== undefined && offset !== undefined;

  const queryKey = enabledQuery
    ? rewardsQueryKey(program, account, limit, offset)
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

  return {
    referrals:
      referrals?.data.deposits.map((deposit) => ({
        ...deposit,
        depositRelayerFeePct: deposit.depositRelayerFeePct || "0",
        rewards: deposit.rewards
          ? {
              ...deposit.rewards,
              usd: parseUnitsWithExtendedDecimals(
                deposit?.rewards?.usd ?? 0,
                18
              ).toString(),
            }
          : undefined,
        feeBreakdown: deposit.feeBreakdown
          ? {
              ...deposit.feeBreakdown,
              bridgeFee: {
                ...deposit.feeBreakdown.bridgeFee,
                usd: parseUnitsWithExtendedDecimals(
                  deposit.feeBreakdown?.bridgeFee?.usd ?? 0,
                  18
                ).toString(),
              },
              destinationGasFee: {
                ...deposit.feeBreakdown.destinationGasFee,
                usd: parseUnitsWithExtendedDecimals(
                  deposit.feeBreakdown?.destinationGasFee?.usd ?? 0,
                  18
                ).toString(),
              },
            }
          : undefined,
      })) || [],
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
  return axios.get<GetRewardsResponse>(
    `${rewardsApiUrl}/rewards/${program}?userAddress=${account}&limit=${limit}&offset=${offset}`
  );
}
