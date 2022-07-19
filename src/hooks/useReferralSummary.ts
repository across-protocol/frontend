import axios from "axios";
import { useQuery } from "react-query";
import { rewardsApiUrl } from "utils";

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

const queryKey = "FETCH_REFERRAL_SUMMARY";
const defaultReferralsSummary: ReferralsSummary = {
  referralRate: 0.4,
  referreeWallets: 0,
  rewardsAmount: "0",
  tier: 1,
  transfers: 0,
  volume: 0,
  activeRefereesCount: 0,
};

export function useReferralSummary(account: string) {
  const { data: summary, ...other } = useQuery(
    queryKey,
    async () => {
      return getReferrals(account!);
    },
    {
      // refetch based on the chain polling interval
      refetchInterval: 60000,
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
async function getReferrals(account: string) {
  return axios.get<ReferralsSummary>(
    `${rewardsApiUrl}/referrals/summary?address=${account}`
  );
}
