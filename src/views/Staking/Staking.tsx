import { Wrapper } from "./Staking.styles";
import { StakingReward, StakingForm, StakingExitAction } from "./components";
import { useStakingView } from "./hooks/useStakingView";
import { LayoutV2, WrongNetworkHeader } from "components";
import { hubPoolChainId } from "utils";

const Staking = () => {
  const {
    poolName,
    poolLogoURI,
    poolLogoURIs,
    isConnected,
    stakingPoolQuery,
    stakeActionMutation,
    claimActionMutation,
    unstakeActionMutation,
    isWrongNetwork,
    poolData,
  } = useStakingView();

  return (
    <>
      <WrongNetworkHeader requiredChainId={hubPoolChainId} />
      <LayoutV2 maxWidth={600}>
        <Wrapper>
          <StakingExitAction
            poolName={poolName}
            poolLogoURI={poolLogoURI}
            poolLogoURIs={poolLogoURIs}
          />
          <StakingForm
            logoURI={poolLogoURI}
            logoURIs={poolLogoURIs}
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
