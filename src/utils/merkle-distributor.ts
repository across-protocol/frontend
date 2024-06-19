import axios from "axios";

import { getConfig } from "utils/config";
import {
  airdropWindowIndex,
  rewardsApiUrl,
  referralsStartWindowIndex,
  rewardProgramTypes,
} from "utils/constants";

export type AmountBreakdown = {
  communityRewards: string;
  liquidityProviderRewards: string;
  earlyUserRewards: string;
  welcomeTravelerRewards: string;
  referralRewards: string;
};

export type AirdropRecipient = {
  accountIndex: number;
  amount: string;
  payload: {
    amountBreakdown: AmountBreakdown;
  };
  proof: string[];
  merkleRoot: string;
  windowIndex: number;
  ipfsHash: string;
  discord: null | Partial<{
    discordId: string;
    discordName: string;
    discordAvatar: string;
  }>;
};

const rewardProgramLookup = {
  referrals: "referral-rewards",
  "op-rebates": "op-rewards",
  "arb-rebates": "arb-rewards",
};

const config = getConfig();

export async function fetchIsClaimed(
  windowIndex: number,
  accountIndex: number,
  rewardsType: rewardProgramTypes
) {
  const merkleDistributor = config.getMerkleDistributor(rewardsType);
  return merkleDistributor.isClaimed(windowIndex, accountIndex);
}

export async function fetchAirdropProof(account?: string) {
  if (!account) {
    return undefined;
  }

  const { data } = await axios.get<AirdropRecipient | Record<string, never>>(
    `${rewardsApiUrl}/airdrop/merkle-distributor-proof`,
    {
      params: {
        address: account,
        windowIndex: airdropWindowIndex,
        includeDiscord: true,
      },
    }
  );
  return Object.keys(data).length ? (data as AirdropRecipient) : undefined;
}

export async function fetchAirdropProofs(
  rewardsType: rewardProgramTypes,
  account?: string
) {
  if (!account) {
    return [];
  }

  const startWindowIndex =
    rewardsType === "referrals" ? referralsStartWindowIndex : 0;
  const rewardsTypeQuery = rewardProgramLookup[rewardsType];
  const { data } = await axios.get<AirdropRecipient[]>(
    `${rewardsApiUrl}/airdrop/merkle-distributor-proofs`,
    {
      params: {
        address: account,
        startWindowIndex,
        rewardsType: rewardsTypeQuery,
      },
    }
  );

  return data;
}
