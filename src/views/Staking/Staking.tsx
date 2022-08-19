import { Wrapper } from "./Staking.styles";
import { StakingReward } from "./components";
import { useStakingView } from "./useStakingView";

const Staking = () => {
  const { amountOfRewardsClaimable } = useStakingView();
  return (
    <Wrapper>
      <StakingReward claimableAmount={amountOfRewardsClaimable} />
    </Wrapper>
  );
};

export default Staking;
