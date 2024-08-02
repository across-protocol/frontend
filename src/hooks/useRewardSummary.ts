import axios from "axios";
import { useQuery } from "@tanstack/react-query";
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

export type RewardsSummary = {
  program: "op-rebates" | "arb-rebates";
} & RebateSummary;

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
  const { data: _summary, ...other } = useQuery({
    queryKey: rewardSummaryQueryKey(program, account),
    queryFn: async ({ queryKey }) => {
      const rewardProgram = queryKey.includes("op-rebates")
        ? "op-rebates"
        : "arb-rebates";
      return getRewardSummary(rewardProgram, account!);
    },
    enabled: !!account,
  });
  return {
    summary:
      _summary?.data ||
      (program === "op-rebates"
        ? defaultOPRewardsSummary
        : defaultARBRebatesSummary),
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
