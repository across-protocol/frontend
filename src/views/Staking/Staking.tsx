import { Wrapper } from "./Staking.styles";
import { StakingReward, StakingForm, StakingExitAction } from "./components";
import { useStakingView } from "./hooks/useStakingView";
import { LayoutV2 } from "components";

const Staking = () => {
  const {
    poolName,
    poolLogoURI,
    poolLogoURIs,
    tokenSymbol,
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
              stakeActionMutation.isPending || unstakeActionMutation.isPending
            }
            isWrongNetwork={isWrongNetwork}
            switchNetwork={isWrongNetworkHandler}
            isConnected={isConnected}
            stakeActionFn={stakeActionMutation.mutateAsync}
            unstakeActionFn={unstakeActionMutation.mutateAsync}
            poolData={poolData}
            tokenSymbol={tokenSymbol}
          />
          <StakingReward
            poolData={poolData}
            isConnected={isConnected}
            claimActionHandler={claimActionMutation.mutateAsync}
            isMutating={claimActionMutation.isPending}
            isWrongNetwork={isWrongNetwork}
            switchNetwork={isWrongNetworkHandler}
          />
        </Wrapper>
      </LayoutV2>
    </>
  );
};

export default Staking;
