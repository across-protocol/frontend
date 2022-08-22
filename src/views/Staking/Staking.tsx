import { useStakingView } from "./useStakingView";
import { Wrapper } from "./Staking.styles";
import { StakingForm, StakingExitAction } from "./components";

const Staking = () => {
  const { poolName, exitLinkURI, poolLogoURI } = useStakingView();

  return (
    <Wrapper>
      <StakingExitAction
        poolName={poolName}
        exitLinkURI={exitLinkURI}
        poolLogoURI={poolLogoURI}
      />
      <StakingForm />
    </Wrapper>
  );
};

export default Staking;
