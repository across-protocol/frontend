import { useStakingView } from "./useStakingView";
import { Wrapper } from "./Staking.styles";

const Staking = () => {
  const { poolId } = useStakingView();

  return <Wrapper>{poolId}</Wrapper>;
};

export default Staking;
