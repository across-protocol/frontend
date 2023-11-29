import axios from "axios";
import { useQuery } from "react-query";
import {
  rewardsApiUrl,
  rewardsQueryKey,
  rewardProgramTypes,
  defaultRefetchInterval,
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
    : "DISABLED_REWARDS_KEY";

  return useQuery(
    queryKey,
    async ({ queryKey: key }) => {
      if (key[0] === "DISABLED_REWARDS_KEY") {
        return;
      }
      return getRewards(...key);
    },
    {
      enabled: enabledQuery,
      refetchInterval: defaultRefetchInterval,
      keepPreviousData: true,
    }
  );
}

/**
 * @param account Address of logged in user.
 * @returns A promise resolving to the referral data of the user
 */
async function getRewards(
  program: rewardProgramTypes,
  account: string,
  limit: number,
  offset: number
) {
  const { data } = await axios.get<GetRewardsResponse>(
    `${rewardsApiUrl}/rewards/${program}`,
    {
      params: {
        userAddress: account,
        limit,
        offset,
      },
    }
  );
  return data;
}
