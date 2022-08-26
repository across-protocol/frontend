import { Wrapper } from "./Staking.styles";
import { StakingReward, StakingForm, StakingExitAction } from "./components";
import { useStakingView } from "./hooks/useStakingView";
import Footer from "components/Footer";

const Staking = () => {
  const {
    poolName,
    exitLinkURI,
    poolLogoURI,
    isConnected,
    connectWalletHandler,
    stakingData,
  } = useStakingView();
  return (
    <>
      <Wrapper>
        <StakingExitAction
          poolName={poolName}
          exitLinkURI={exitLinkURI}
          poolLogoURI={poolLogoURI}
        />
        <StakingForm />
        <StakingReward
          maximumClaimableAmount={stakingData?.outstandingRewards ?? "0"}
          isConnected={isConnected}
          connectWalletHandler={connectWalletHandler}
        />
      </Wrapper>
      <Footer />
    </>
  );
};

export default Staking;
