import { Wrapper } from "./Staking.styles";
import { StakingReward, StakingForm, StakingExitAction } from "./components";
import { useStakingView } from "./hooks/useStakingView";
import Footer from "components/Footer";
import { repeatableTernaryBuilder } from "utils/ternary";
import { BigNumberish } from "ethers";

const Staking = () => {
  const {
    poolName,
    exitLinkURI,
    poolLogoURI,
    isConnected,
    connectWalletHandler,
    stakingData,
    isStakingDataLoading,
  } = useStakingView();

  const numericTernary = repeatableTernaryBuilder<BigNumberish>(
    !isStakingDataLoading || !stakingData,
    "0"
  );
  const stringTernary = repeatableTernaryBuilder<string>(
    !isStakingDataLoading || !stakingData,
    ""
  );

  return (
    <>
      <Wrapper>
        <StakingExitAction
          poolName={poolName}
          exitLinkURI={exitLinkURI}
          poolLogoURI={poolLogoURI}
        />
        <StakingForm
          isConnected={isConnected}
          walletConnectionHandler={connectWalletHandler}
          lpTokenName={stringTernary(stakingData?.lpTokenSymbolName)}
          userCumulativeStake={numericTernary(
            stakingData?.userAmountOfLPStaked
          )}
          currentMultiplier={numericTernary(
            stakingData?.currentUserRewardMultiplier
          )}
          maxMultiplier={numericTernary(stakingData?.maxMultiplier)}
          globalCumulativeStake={numericTernary(
            stakingData?.globalAmountOfLPStaked
          )}
          ageOfCapital={numericTernary(stakingData?.averageDepositTime)}
        />
        <StakingReward
          maximumClaimableAmount={numericTernary(
            stakingData?.outstandingRewards
          )}
          isConnected={isConnected}
          walletConnectionHandler={connectWalletHandler}
        />
      </Wrapper>
      <Footer />
    </>
  );
};

export default Staking;
