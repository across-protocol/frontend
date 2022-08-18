// import { usePoolRewardsView } from "./usePoolRewardsView";
import { Wrapper } from "./PoolRewards.styles";
import StakeForm from "./components/StakingForm";

const PoolRewards = () => {
  // const { poolId } = usePoolRewardsView();

  return (
    <Wrapper>
      <StakeForm />
    </Wrapper>
  );
};

export default PoolRewards;
