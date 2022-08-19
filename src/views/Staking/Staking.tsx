import { useStakingView } from "./useStakingView";
import { Wrapper } from "./Staking.styles";
import { StakingExitAction } from "./components";

const Staking = () => {
  const { poolId, exitLinkURI } = useStakingView();

  return (
    <Wrapper>
      <StakingExitAction poolId={poolId} exitLinkURI={exitLinkURI} />
    </Wrapper>
  );
};

export default Staking;
