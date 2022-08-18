import { usePoolRewardsView } from "./usePoolRewardsView";
import { Wrapper } from "./PoolRewards.styles";

const PoolRewards = () => {
  const { poolId } = usePoolRewardsView();

  return <Wrapper>{poolId}</Wrapper>;
};

export default PoolRewards;
