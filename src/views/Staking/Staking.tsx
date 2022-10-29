import { Wrapper } from "./Staking.styles";
import { StakingReward, StakingForm, StakingExitAction } from "./components";
import { useStakingView } from "./hooks/useStakingView";
import Footer from "components/Footer";
import { repeatableTernaryBuilder } from "utils/ternary";
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
    poolData,
  } = useStakingView();

  const numberTernary = repeatableTernaryBuilder<number>(
    !stakingPoolQuery.isLoading,
    0
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
          logoURI={poolLogoURI}
          isDataLoading={stakingPoolQuery.isLoading}
          isMutating={
            stakeActionMutation.isLoading || unstakeActionMutation.isLoading
          }
          isWrongNetwork={isWrongNetwork}
          isConnected={isConnected}
          walletConnectionHandler={connectWalletHandler}
          stakeActionFn={stakeActionMutation.mutateAsync}
          unstakeActionFn={unstakeActionMutation.mutateAsync}
          poolData={poolData}
        />
        <StakingReward
          maximumClaimableAmount={poolData.outstandingRewards}
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
