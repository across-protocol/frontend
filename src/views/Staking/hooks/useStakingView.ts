import { useParams } from "react-router-dom";

import { useConnection, useIsWrongNetwork, useStakingPool } from "hooks";
import { getConfig, hubPoolChainId } from "utils";
import { DEFAULT_STAKING_POOL_DATA } from "utils/staking-pool";

import { useStakeAction, useUnstakeAction } from "./useStakingAction";
import { useClaimStakeRewardAction } from "./useClaimStakeRewardAction";

type StakingPathParams = {
  poolId: string;
};

const config = getConfig();

export const useStakingView = () => {
  const { poolId } = useParams<StakingPathParams>();
  const { isConnected, provider } = useConnection();
  const { isWrongNetwork, isWrongNetworkHandler } = useIsWrongNetwork();
  const { l1TokenAddress, logoURI, logoURIs } =
    config.getStakingPoolTokenInfoBySymbol(hubPoolChainId, poolId);

  const stakingPoolQuery = useStakingPool(l1TokenAddress);
  const stakeActionMutation = useStakeAction(l1TokenAddress);
  const unstakeActionMutation = useUnstakeAction(l1TokenAddress);
  const claimActionMutation = useClaimStakeRewardAction(l1TokenAddress);

  return {
    stakingPoolQuery,
    poolData: stakingPoolQuery.data ?? DEFAULT_STAKING_POOL_DATA,
    stakeActionMutation,
    unstakeActionMutation,
    claimActionMutation,
    poolId,
    exitLinkURI: "/rewards",
    poolLogoURI: logoURI,
    poolLogoURIs: logoURIs,
    poolName: stakingPoolQuery.data?.lpTokenSymbolName ?? "-",
    mainnetAddress: l1TokenAddress,
    isWrongNetwork,
    isWrongNetworkHandler,
    isConnected,
    provider,
  };
};
