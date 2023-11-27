import { BigNumber } from "ethers";
import { useConnection } from "hooks";
import { ReferralsSummary, useReferralSummary } from "hooks/useReferralSummary";
import { useMemo } from "react";
import { formatUnitsFnBuilder } from "utils";
import { repeatableTernaryBuilder } from "utils/ternary";
import { useStakingPools } from "./useStakingPools";

export function useRewards() {
  const { isConnected, connect, account } = useConnection();
  const { summary, isLoading } = useReferralSummary("referrals", account);

  const {
    myPools,
    allPools,
    enabledPools,
    isLoading: areStakingPoolsLoading,
  } = useStakingPools();

  const { totalRewards, stakingRewards, referralRewards } = useMemo(() => {
    const poolRewards = enabledPools.reduce(
      (prev, curr) => prev.add(curr.outstandingRewards),
      BigNumber.from(0)
    );
    const referralRewards = BigNumber.from(summary.rewardsAmount);
    return {
      totalRewards: poolRewards.add(referralRewards),
      referralRewards,
      stakingRewards: poolRewards,
    };
  }, [summary, enabledPools]);

  const usersLPStakedInUSD = useMemo(() => {
    return enabledPools.reduce(
      (prev, curr) => prev.add(curr.userAmountOfLPStakedInUSD),
      BigNumber.from(0)
    );
  }, [enabledPools]);

  const largestStakedPool = useMemo(() => {
    if (myPools.length === 0) return undefined;
    let largestPool = myPools[0];
    myPools.forEach((pool) => {
      if (
        pool.userAmountOfLPStakedInUSD.gt(largestPool.userAmountOfLPStakedInUSD)
      ) {
        largestPool = pool;
      }
    });
    return {
      name: largestPool.tokenDisplaySymbol ?? largestPool.tokenSymbol,
      logo: largestPool.tokenLogoURI,
      amount: largestPool.userAmountOfLPStakedInUSD,
    };
  }, [myPools]);

  return {
    isConnected,
    address: account,
    connectHandler: () => {
      connect({ trackSection: "rewardsTable" });
    },
    totalRewards: totalRewards,
    stakingRewards,
    referralACXRewards: referralRewards,
    stakedTokens: usersLPStakedInUSD,
    ...formatReferralSummary(summary, !isLoading && isConnected),
    areStakingPoolsLoading,
    myPoolData: myPools,
    allPoolData: allPools,
    largestStakedPool,
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
