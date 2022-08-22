import { useStakingView } from "./useStakingView";
import { Wrapper } from "./Staking.styles";
import { StakingForm, StakingExitAction } from "./components";

const Staking = () => {
  const { poolName, exitLinkURI, poolLogoURI } = useStakingView();

  return (
    <Wrapper>
      <StakingForm />
      <StakingExitAction
        poolName={poolName}
        exitLinkURI={exitLinkURI}
        poolLogoURI={poolLogoURI}
      />
    </Wrapper>
  );
};

export default Staking;
