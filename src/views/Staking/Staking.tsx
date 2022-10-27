import { Wrapper } from "./Staking.styles";
import { StakingReward, StakingForm, StakingExitAction } from "./components";
import { useStakingView } from "./hooks/useStakingView";
import Footer from "components/Footer";
import { repeatableTernaryBuilder } from "utils/ternary";
import { BigNumber, BigNumberish } from "ethers";
import { SuperHeader } from "components";
import { getChainInfo, hubPoolChainId } from "utils";

const Staking = () => {
  const {
    poolName,
    poolLogoURI,
    isConnected,
    connectWalletHandler,
    stakingPoolQuery,
    stakeActionMutation,
    unstakeActionMutation,
    isWrongNetwork,
    isWrongNetworkHandler,
  } = useStakingView();

  const numericTernary = repeatableTernaryBuilder<BigNumberish>(
    !stakingPoolQuery.isLoading,
    "0"
  );
  const numberTernary = repeatableTernaryBuilder<number>(
    !stakingPoolQuery.isLoading,
    0
  );
  const stringTernary = repeatableTernaryBuilder<string>(
    !stakingPoolQuery.isLoading,
    ""
  );

  return (
    <>
      {isWrongNetwork && (
        <SuperHeader>
          <div>
            You are on an incorrect network. Please{" "}
            <button onClick={isWrongNetworkHandler}>
              switch to {getChainInfo(hubPoolChainId).name}
            </button>
          </div>
        </SuperHeader>
      )}
      <Wrapper>
        <StakingExitAction poolName={poolName} poolLogoURI={poolLogoURI} />
        <StakingForm
          logoURI={stakingPoolQuery.data?.tokenLogoURI || ""}
          isDataLoading={stakingPoolQuery.isLoading}
          isMutating={
            stakeActionMutation.isLoading || unstakeActionMutation.isLoading
          }
          isWrongNetwork={isWrongNetwork}
          isConnected={isConnected}
          walletConnectionHandler={connectWalletHandler}
          lpTokenFormatter={
            stakingPoolQuery.data?.lpTokenFormatter ?? (() => "0")
          }
          lpTokenParser={
            stakingPoolQuery.data?.lpTokenParser ?? (() => BigNumber.from("0"))
          }
          estimatedPoolApy={numericTernary(
            stakingPoolQuery.data?.apyData.poolApy
          )}
          lpTokenName={stringTernary(stakingPoolQuery.data?.lpTokenSymbolName)}
          stakeActionFn={stakeActionMutation.mutateAsync}
          unstakeActionFn={unstakeActionMutation.mutateAsync}
          usersTotalLPTokens={numericTernary(
            stakingPoolQuery.data?.usersTotalLPTokens
          )}
          userCumulativeStake={numericTernary(
            stakingPoolQuery.data?.userAmountOfLPStaked
          )}
          currentMultiplier={numericTernary(
            stakingPoolQuery.data?.currentUserRewardMultiplier
          )}
          usersMultiplierPercentage={numberTernary(
            stakingPoolQuery.data?.usersMultiplierPercentage
          )}
          globalCumulativeStake={numericTernary(
            stakingPoolQuery.data?.globalAmountOfLPStaked
          )}
          ageOfCapital={numberTernary(
            stakingPoolQuery.data?.elapsedTimeSinceAvgDeposit
          )}
          availableLPTokenBalance={numericTernary(
            stakingPoolQuery.data?.availableLPTokenBalance
          )}
          shareOfPool={numericTernary(stakingPoolQuery.data?.shareOfPool)}
        />
        <StakingReward
          maximumClaimableAmount={numericTernary(
            stakingPoolQuery.data?.outstandingRewards
          )}
          usersMultiplierPercentage={numberTernary(
            stakingPoolQuery.data?.usersMultiplierPercentage
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
