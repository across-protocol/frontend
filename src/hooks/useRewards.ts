import axios from "axios";
import { useQuery } from "@tanstack/react-query";
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

  return useQuery({
    queryKey: rewardsQueryKey(program, account, limit, offset),
    queryFn: async ({ queryKey: key }) => {
      const [, _program, _account, _limit, _offset] = key;
      if (!_program || !_account || !_limit) {
        throw new Error("Disabled rewards query key");
      }
      return getRewards(_program, _account, _limit, _offset ?? 0);
    },
    enabled: enabledQuery,
    refetchInterval: defaultRefetchInterval,
    keepPreviousData: true,
  });
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
