import { StyledETHIcon } from "components/RewardTable/RewardTables.styles";
import { useConnection } from "hooks";
import { ReferralsSummary, useReferralSummary } from "hooks/useReferralSummary";
import { formatUnitsFnBuilder, parseUnits } from "utils";
import { repeatableTernaryBuilder } from "utils/ternary";
import { GenericStakingPoolRowData } from "../components/GenericStakingPoolTable/GenericStakingPoolTable";

export function useRewards() {
  const { isConnected, connect, account } = useConnection();
  const { summary, isLoading } = useReferralSummary(account);

  return {
    isConnected,
    address: account,
    connectHandler: () => connect(),
    totalRewards: "726.45 ACX",
    stakedTokens: "$942,021.23",
    ...formatReferralSummary(summary, !isLoading && isConnected),
    poolData: formatPoolData(),
  };
}

function formatReferralSummary(summary: ReferralsSummary, isValid: boolean) {
  const stringTernary = repeatableTernaryBuilder<string | undefined>(
    isValid,
    undefined
  );
  const numericTernary = repeatableTernaryBuilder<number | undefined>(
    isValid,
    undefined
  );

  return {
    referralWallets: numericTernary(summary.referreeWallets),
    referralTransfers: numericTernary(summary.transfers),
    referralVolume: numericTernary(summary.volume),
    referralRewards: stringTernary(summary.rewardsAmount),
    referralTier: numericTernary(summary.tier),
    referralRate: numericTernary(summary.referralRate),
    formatterFn: formatUnitsFnBuilder(18),
  };
}

function formatPoolData(): GenericStakingPoolRowData[] {
  return [
    {
      poolName: "ETH",
      logo: StyledETHIcon,
      multiplier: 2,
      rewardAPY: parseUnits(".0278", 18),
      baseAPY: parseUnits(".0139", 18),
      rewardFormatter: formatUnitsFnBuilder(18),
      lpTokenFormatter: formatUnitsFnBuilder(6),
      rewards: parseUnits("1", 18),
      ageOfCapital: 3,
      usersStakedLP: parseUnits("942021.23", 6),
      usersTotalLP: parseUnits("1242021.23", 6),
    },
    {
      poolName: "ETH",
      logo: StyledETHIcon,
      multiplier: 2,
      rewardAPY: parseUnits(".0278", 18),
      baseAPY: parseUnits(".0139", 18),
      rewardFormatter: formatUnitsFnBuilder(18),
      lpTokenFormatter: formatUnitsFnBuilder(6),
      rewards: parseUnits("1", 18),
      ageOfCapital: 3,
      usersStakedLP: parseUnits("0", 6),
      usersTotalLP: parseUnits("1242021.23", 6),
    },
  ];
}
