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
    !isStakingDataLoading,
    "0"
  );
  const numberTernary = repeatableTernaryBuilder<number>(
    !isStakingDataLoading,
    0
  );
  const stringTernary = repeatableTernaryBuilder<string>(
    !isStakingDataLoading,
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
          usersTotalLPTokens={numericTernary(stakingData?.usersTotalLPTokens)}
          userCumulativeStake={numericTernary(
            stakingData?.userAmountOfLPStaked
          )}
          currentMultiplier={numericTernary(
            stakingData?.currentUserRewardMultiplier
          )}
          usersMultiplierPercentage={numberTernary(
            stakingData?.usersMultiplierPercentage
          )}
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
