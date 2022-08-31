import { Wrapper } from "./Staking.styles";
import { StakingReward, StakingForm, StakingExitAction } from "./components";
import { useStakingView } from "./hooks/useStakingView";
import Footer from "components/Footer";
import { repeatableTernaryBuilder } from "utils/ternary";
import { BigNumber, BigNumberish } from "ethers";
import {
  StakingActionFunctionType,
  stakingActionNOOPFn,
} from "./hooks/useStakingClaimRewards";

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

  const stakingFnTernary = repeatableTernaryBuilder<StakingActionFunctionType>(
    !isStakingDataLoading,
    stakingActionNOOPFn
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
          lpTokenFormatter={stakingData?.lpTokenFormatter ?? (() => "0")}
          lpTokenParser={
            stakingData?.lpTokenParser ?? (() => BigNumber.from("0"))
          }
          lpTokenName={stringTernary(stakingData?.lpTokenSymbolName)}
          stakeActionFn={stakingFnTernary(stakingData?.stakeActionFn)}
          unstakeActionFn={stakingFnTernary(stakingData?.unstakeActionFn)}
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
          ageOfCapital={numberTernary(stakingData?.elapsedTimeSinceAvgDeposit)}
          availableLPTokenBalance={numericTernary(
            stakingData?.availableLPTokenBalance
          )}
          shareOfPool={numericTernary(stakingData?.shareOfPool)}
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
