import axios from "axios";
import { useQuery } from "react-query";
import {
  rewardsApiUrl,
  referralSummaryQueryKey,
  rewardProgramTypes,
} from "utils";

/**
 * Fetches the latest block from a given chain Id on an interval.
 * @param account Address of logged in user.
 * @returns Referral summary data and useQuery params.
 */

export interface ReferralsSummary {
  referreeWallets: number;
  transfers: number;
  volume: number;
  referralRate: number;
  rewardsAmount: string;
  tier: number;
  activeRefereesCount: number;
}

const defaultReferralsSummary: ReferralsSummary = {
  referralRate: 0.4,
  referreeWallets: 0,
  rewardsAmount: "0",
  tier: 1,
  transfers: 0,
  volume: 0,
  activeRefereesCount: 0,
};

export function useReferralSummary(
  program: rewardProgramTypes,
  account?: string
) {
  const queryKey = !!account
    ? referralSummaryQueryKey(account, program)
    : "DISABLED_REFERRAL_SUMMARY_KEY";

  const { data: summary, ...other } = useQuery(
    queryKey,
    async () => {
      return getReferralSummary(program, account!);
    },
    {
      // refetch based on the chain polling interval
      // disable this temporary
      // refetchInterval: 60000,
      enabled: !!account,
    }
  );

  return {
    summary: summary?.data || defaultReferralsSummary,
    ...other,
  };
}

/**
 * @param account Address of logged in user.
 * @returns A promise resolving to the referral summary of the user
 */
async function getReferralSummary(
  program: rewardProgramTypes,
  account: string
) {
  return axios.get<ReferralsSummary>(
    `${rewardsApiUrl}/${program}/summary?address=${account}`
  );
}
