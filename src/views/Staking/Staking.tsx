// import { useStakingView } from "./useStakingView";
import { Wrapper } from "./Staking.styles";
import { StakingForm } from "./components";

const Staking = () => {
  // const { poolId } = useStakingView();

  return (
    <Wrapper>
      <StakingForm />
    </Wrapper>
  );
};

export default Staking;
