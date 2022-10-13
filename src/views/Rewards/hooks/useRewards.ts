import { useConnection } from "hooks";
import { ReferralsSummary, useReferralSummary } from "hooks/useReferralSummary";
import { formatUnitsFnBuilder } from "utils";
import { repeatableTernaryBuilder } from "utils/ternary";

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
