import { Wrapper } from "./Staking.styles";
import { StakingReward, StakingForm, StakingExitAction } from "./components";
import { useStakingView } from "./useStakingView";

const Staking = () => {
  const { amountOfRewardsClaimable, poolName, exitLinkURI, poolLogoURI } =
    useStakingView();
  return (
    <Wrapper>
      <StakingExitAction
        poolName={poolName}
        exitLinkURI={exitLinkURI}
        poolLogoURI={poolLogoURI}
      />
      <StakingForm />
      <StakingReward maximumClaimableAmount={amountOfRewardsClaimable} />
    </Wrapper>
  );
};

export default Staking;
