import { useConnection, useReferralSummary } from "hooks";
import { GenericRewardInformationRowType } from "../GenericRewardsProgram/GenericInformationCard";
import {
  formatNumberTwoFracDigits,
  formatUnits,
  getToken,
  rewardTiers,
} from "utils";
import { useMemo } from "react";
import { useUnclaimedReferralProofs } from "hooks/useUnclaimedReferralProofs";
import { BigNumber } from "ethers";

export function useACXReferralsProgram() {
  const { account } = useConnection();
  const { summary } = useReferralSummary("referrals", account);
  const token = useMemo(() => getToken("ACX"), []);
  const { data: unclaimedReferralData } = useUnclaimedReferralProofs();

  const { currentTier, nextTier } = useMemo(
    () => ({
      currentTier: rewardTiers[summary.tier - 1],
      nextTier:
        summary.tier < rewardTiers.length
          ? rewardTiers[summary.tier]
          : undefined,
    }),
    [summary.tier]
  );

  const labels: GenericRewardInformationRowType[] = useMemo(
    () => [
      {
        title: "Tier",
        tooltip: "Your current tier",
        prefix: nextTier ? `Next tier: ${nextTier.title}` : undefined,
        value: currentTier.title,
        extendedPrefixSpacing: true,
      },
      {
        title: "Referee wallets",
        tooltip:
          "Number of unique wallets actively linked to your referral link.",
        value: String(summary.activeRefereesCount),
      },
      {
        title: "Unique referral transfers",
        tooltip: "Total number of unique wallets that used your referral link.",
        value: String(summary.referreeWallets),
        prefixArrow: true,
        prefix: nextTier
          ? `${nextTier.referrals - summary.referreeWallets} to next tier`
          : undefined,
      },
      {
        title: "Transfers",
        value: String(summary.transfers),
      },
      {
        title: "Volume from transfers",
        value: `$${formatNumberTwoFracDigits(summary.volume)}`,
        prefixArrow: true,
        prefix: nextTier
          ? `$${formatNumberTwoFracDigits(
              nextTier.volume - summary.volume
            )} to next tier`
          : undefined,
      },
      {
        title: "Referral rate",
        value: `${summary.referralRate * 100}% referral rate`,
        prefix: `${Math.floor(summary.referralRate * 100 * 0.25)}% for referee`,
      },
      {
        title: "Total Rewards",
        value: `${formatUnits(summary.rewardsAmount, token.decimals)} ACX`,
        prefix: unclaimedReferralData?.claimableAmount.gt(0)
          ? `${formatUnits(
              unclaimedReferralData.claimableAmount,
              token.decimals
            )} ACX claimable`
          : undefined,
        prefixIcon: "clock",
      },
    ],
    [
      currentTier.title,
      nextTier,
      summary.activeRefereesCount,
      summary.referralRate,
      summary.referreeWallets,
      summary.rewardsAmount,
      summary.transfers,
      summary.volume,
      token.decimals,
      unclaimedReferralData?.claimableAmount,
    ]
  );

  return {
    labels,
    rewardsAmount: BigNumber.from(summary.rewardsAmount),
    claimableAmount: BigNumber.from(
      unclaimedReferralData?.claimableAmount || 0
    ),
  };
}
