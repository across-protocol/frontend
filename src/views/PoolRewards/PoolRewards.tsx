import { usePoolRewardsView } from "./usePoolRewardsView";

const PoolRewards = () => {
  const { poolId } = usePoolRewardsView();

  return <div>{poolId}</div>;
};

export default PoolRewards;
