import { Wrapper } from "./Staking.styles";
import { StakingReward, StakingForm, StakingExitAction } from "./components";
import { useStakingView } from "./useStakingView";

const Staking = () => {
  const {
    amountOfRewardsClaimable,
    poolName,
    exitLinkURI,
    poolLogoURI,
    isConnected,
    walletConnectionHandler,
  } = useStakingView();
  return (
    <Wrapper>
      <StakingExitAction
        poolName={poolName}
        exitLinkURI={exitLinkURI}
        poolLogoURI={poolLogoURI}
      />
      <StakingForm
        isConnected={isConnected}
        walletConnectionHandler={walletConnectionHandler}
      />
      <StakingReward
        maximumClaimableAmount={amountOfRewardsClaimable}
        isConnected={isConnected}
        walletConnectionHandler={walletConnectionHandler}
      />
    </Wrapper>
  );
};

export default Staking;
