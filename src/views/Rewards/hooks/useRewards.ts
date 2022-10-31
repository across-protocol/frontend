import { BigNumber } from "ethers";
import { useConnection } from "hooks";
import { ReferralsSummary, useReferralSummary } from "hooks/useReferralSummary";
import { useMemo } from "react";
import { formatUnitsFnBuilder } from "utils";
import { repeatableTernaryBuilder } from "utils/ternary";
import { useStakingPools } from "./useStakingPools";

export function useRewards() {
  const { isConnected, connect, account } = useConnection();
  const { summary, isLoading } = useReferralSummary(account);

  const {
    myPools,
    allPools,
    enabledPools,
    isLoading: areStakingPoolsLoading,
  } = useStakingPools();

  const totalRewards = useMemo(() => {
    const poolRewards = enabledPools.reduce(
      (prev, curr) => prev.add(curr.outstandingRewards),
      BigNumber.from(0)
    );
    const referralRewards = BigNumber.from(summary.rewardsAmount);
    return poolRewards.add(referralRewards);
  }, [summary, enabledPools]);

  return {
    isConnected,
    address: account,
    connectHandler: () => connect(),
    totalRewards: totalRewards,
    stakedTokens: "$942,021.23",
    ...formatReferralSummary(summary, !isLoading && isConnected),
    areStakingPoolsLoading,
    myPoolData: myPools,
    allPoolData: allPools,
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
