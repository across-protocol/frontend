import axios from "axios";
import { useQuery } from "react-query";
import {
  rewardsApiUrl,
  rewardSummaryQueryKey,
  rewardProgramTypes,
} from "utils";

export type RebateSummary = {
  depositsCount: number;
  unclaimedRewards?: string;
  volumeUsd: number;
  claimableRewards: string;
};

export type ACXReferralSummary = {
  referreeWallets: number;
  transfers: number;
  volume: number;
  referralRate: number;
  rewardsAmount: string;
  tier: number;
  activeRefereesCount: number;
};

export type RewardsSummary =
  | ({
      program: "referrals";
    } & ACXReferralSummary)
  | ({
      program: "op-rebates" | "arb-rebates";
    } & RebateSummary);

const defaultACXRewardsSummary: RewardsSummary = {
  program: "referrals",
  referralRate: 0.4,
  referreeWallets: 0,
  rewardsAmount: "0",
  tier: 1,
  transfers: 0,
  volume: 0,
  activeRefereesCount: 0,
};

const defaultOPRewardsSummary: RewardsSummary = {
  program: "op-rebates",
  claimableRewards: "0",
  depositsCount: 0,
  unclaimedRewards: "0",
  volumeUsd: 0,
};

const defaultARBRebatesSummary: RewardsSummary = {
  program: "arb-rebates",
  claimableRewards: "0",
  depositsCount: 0,
  unclaimedRewards: "0",
  volumeUsd: 0,
};

export function useRewardSummary(
  program: rewardProgramTypes,
  account?: string
) {
  const queryKey = account
    ? rewardSummaryQueryKey(account, program)
    : ["DISABLED_REFERRAL_SUMMARY_KEY", program];

  const { data: _summary, ...other } = useQuery(
    queryKey,
    async ({ queryKey }) => {
      const rewardProgram = queryKey.includes("op-rebates")
        ? "op-rebates"
        : queryKey.includes("arb-rebates")
          ? "arb-rebates"
          : "referrals";
      return getRewardSummary(rewardProgram, account!);
    },
    {
      // refetch based on the chain polling interval
      // disable this temporary
      // refetchInterval: 60000,
      enabled: !!account,
    }
  );
  return {
    summary:
      _summary?.data ||
      (program === "op-rebates"
        ? defaultOPRewardsSummary
        : program === "arb-rebates"
          ? defaultARBRebatesSummary
          : defaultACXRewardsSummary),
    ...other,
  };
}

/**
 * @param account Address of logged in user.
 * @returns A promise resolving to the referral summary of the user
 */
async function getRewardSummary(program: rewardProgramTypes, account: string) {
  const result = await axios.get<RewardsSummary>(
    `${rewardsApiUrl}/rewards/${program}/summary?userAddress=${account}`
  );
  if (result.data) {
    result.data.program = program;
  }
  return result;
}
