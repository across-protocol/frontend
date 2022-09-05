import { useConnection } from "state/hooks";
import { onboard } from "utils";
import { useStakingClaimRewards } from "./useStakingClaimRewards";
import { useStakingPoolResolver } from "./useStakingPoolResolver";

export const useStakingView = () => {
  const { isConnected, provider } = useConnection();
  const { poolId, exitLinkURI, poolLogoURI, poolName, mainnetAddress } =
    useStakingPoolResolver();

  //FIXME: Redirect to 404 prior to continuing

  // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

  const {
    isStakingDataLoading,
    stakingData,
    isWrongNetwork,
    isWrongNetworkHandler,
  } = useStakingClaimRewards();

  return {
    poolId,
    exitLinkURI,
    poolLogoURI,
    poolName,
    mainnetAddress,
    isStakingDataLoading: isStakingDataLoading && !!stakingData,
    isWrongNetwork,
    isWrongNetworkHandler,
    stakingData,
    isConnected: isConnected,
    provider: provider,
    connectWalletHandler: onboard.init,
  };
};
