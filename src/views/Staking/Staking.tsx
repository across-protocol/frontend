import { Wrapper } from "./Staking.styles";
import { StakingReward, StakingForm, StakingExitAction } from "./components";
import { useStakingView } from "./hooks/useStakingView";
import { LayoutV2, SuperHeader } from "components";
import { getChainInfo, hubPoolChainId } from "utils";

const Staking = () => {
  const {
    poolName,
    poolLogoURI,
    isConnected,
    stakingPoolQuery,
    stakeActionMutation,
    claimActionMutation,
    unstakeActionMutation,
    isWrongNetwork,
    isWrongNetworkHandler,
    poolData,
  } = useStakingView();

  return (
    <>
      {isWrongNetwork && (
        <SuperHeader>
          <div>
            You are on the incorrect network. Please{" "}
            <button onClick={isWrongNetworkHandler}>
              switch to {getChainInfo(hubPoolChainId).name}
            </button>
          </div>
        </SuperHeader>
      )}
      <LayoutV2 maxWidth={600}>
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
            stakeActionFn={stakeActionMutation.mutateAsync}
            unstakeActionFn={unstakeActionMutation.mutateAsync}
            poolData={poolData}
          />
          <StakingReward
            poolData={poolData}
            isConnected={isConnected}
            claimActionHandler={claimActionMutation.mutateAsync}
            isMutating={claimActionMutation.isLoading}
          />
        </Wrapper>
      </LayoutV2>
    </>
  );
};

export default Staking;
