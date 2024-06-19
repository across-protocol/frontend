import axios from "axios";
import { useQuery } from "react-query";
import { rewardsApiUrl, simplifiedReferralSummaryQueryKey } from "utils";
import { ACXReferralSummary } from "./useRewardSummary";

export type SimplifiedReferralsSummary = Pick<
  ACXReferralSummary,
  "tier" | "referralRate"
>;

const defaultReferralsSummary: SimplifiedReferralsSummary = {
  referralRate: 0.4,
  tier: 1,
};

export function useSimplifiedReferralSummary(account?: string) {
  const queryKey = account
    ? simplifiedReferralSummaryQueryKey(account)
    : "DISABLED_REFERRAL_SUMMARY_KEY";

  const { data: summary, ...other } = useQuery(
    queryKey,
    async () => {
      return getReferralSummary(account!);
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
async function getReferralSummary(account: string) {
  return axios.get<SimplifiedReferralsSummary>(
    `${rewardsApiUrl}/referrals/summary?address=${account}&fields[]=referralRate&fields[]=tier`
  );
}
