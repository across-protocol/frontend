import { Wrapper } from "./Staking.styles";
import { StakingReward, StakingForm, StakingExitAction } from "./components";
import { useStakingView } from "./hooks/useStakingView";
import Footer from "components/Footer";
import { repeatableTernaryBuilder } from "utils/ternary";
import { BigNumberish } from "ethers";
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

  const numericTernary = repeatableTernaryBuilder<BigNumberish>(
    !stakingPoolQuery.isLoading,
    "0"
  );
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
