import { useAllStakingPools } from "hooks";

export const useStakingPools = () => {
  const allStakingPoolsQueries = useAllStakingPools();
  const isLoading = allStakingPoolsQueries.some((query) => query.isLoading);
  const stakingPools = allStakingPoolsQueries.flatMap(
    (query) => query.data || []
  );
  const myPools = stakingPools.filter(
    (pool) => pool.poolEnabled && pool.isStakingPoolOfUser
  );
  const allPools = stakingPools.filter(
    (pool) => pool.poolEnabled && !pool.isStakingPoolOfUser
  );

  return {
    myPools,
    allPools,
    isLoading,
  };
};
