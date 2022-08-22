import { Wrapper } from "./Staking.styles";
import { StakingReward, StakingForm } from "./components";
import { useStakingView } from "./useStakingView";

const Staking = () => {
  const { amountOfRewardsClaimable } = useStakingView();
  return (
    <Wrapper>
      <StakingForm />
      <StakingReward maximumClaimableAmount={amountOfRewardsClaimable} />
    </Wrapper>
  );
};

export default Staking;
