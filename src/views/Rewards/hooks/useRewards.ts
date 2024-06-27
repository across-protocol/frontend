import { BigNumber } from "ethers";
import { useConnection } from "hooks";
import { useMemo } from "react";
import { useStakingPools } from "./useStakingPools";

export function useRewards() {
  const { isConnected, connect, account } = useConnection();

  const {
    myPools,
    allPools,
    enabledPools,
    isLoading: areStakingPoolsLoading,
  } = useStakingPools();

  const stakingRewards = useMemo(() => {
    const poolRewards = enabledPools.reduce(
      (prev, curr) => prev.add(curr.outstandingRewards),
      BigNumber.from(0)
    );
    return poolRewards;
  }, [enabledPools]);

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
    stakingRewards,
    stakedTokens: usersLPStakedInUSD,
    areStakingPoolsLoading,
    myPoolData: myPools,
    allPoolData: allPools,
    largestStakedPool,
  };
}
