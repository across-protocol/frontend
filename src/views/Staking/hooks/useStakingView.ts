import { useConnection, useIsWrongNetwork } from "hooks";

import { useStakingPoolResolver } from "./useStakingPoolResolver";
import { useStakingPool } from "./useStakingPool";
import { useStakeAction, useUnstakeAction } from "./useStakingAction";

export const useStakingView = () => {
  const { isConnected, provider, connect } = useConnection();
  const { isWrongNetwork, isWrongNetworkHandler } = useIsWrongNetwork();

  const { poolId, exitLinkURI, poolLogoURI, poolName, mainnetAddress } =
    useStakingPoolResolver();
  const stakingPoolQuery = useStakingPool(mainnetAddress);
  const stakeActionMutation = useStakeAction(mainnetAddress);
  const unstakeActionMutation = useUnstakeAction(mainnetAddress);

  return {
    stakingPoolQuery,
    stakeActionMutation,
    unstakeActionMutation,
    poolId,
    exitLinkURI,
    poolLogoURI,
    poolName,
    mainnetAddress,
    isWrongNetwork,
    isWrongNetworkHandler,
    isConnected,
    provider,
    connectWalletHandler: () => connect(),
  };
};
