import { useStakingView } from "./useStakingView";
import { Wrapper } from "./Staking.styles";
import { StakingExitAction } from "./components";

const Staking = () => {
  const { poolId, exitLinkURI, poolLogoURI } = useStakingView();

  return (
    <Wrapper>
      <StakingExitAction
        poolId={poolId}
        exitLinkURI={exitLinkURI}
        poolLogoURI={poolLogoURI}
      />
    </Wrapper>
  );
};

export default Staking;
