import { useAllStakingPools } from "hooks";

export const useStakingPools = () => {
  const allStakingPoolsQueries = useAllStakingPools();
  const isLoading = allStakingPoolsQueries.some((query) => query.isLoading);
  const stakingPools = allStakingPoolsQueries.flatMap(
    (query) => query.data || []
  );
  const enabledPools = stakingPools.filter((pool) => pool.poolEnabled);
  const poolsWithLP = enabledPools.filter((pool) => pool.isStakingPoolOfUser);
  const myPools = [
    ...poolsWithLP.filter((pool) => pool.userAmountOfLPStaked.gt(0)),
    ...poolsWithLP.filter((pool) => pool.userAmountOfLPStaked.eq(0)),
  ];
  const allPools = enabledPools.filter((pool) => !pool.isStakingPoolOfUser);

  return {
    myPools,
    allPools,
    enabledPools,
    isLoading,
  };
};
