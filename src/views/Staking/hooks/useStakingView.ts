import { useConnection } from "state/hooks";
import { onboard } from "utils";
import { useStakingActionsResolver } from "./useStakingActionsResolver";
import { useStakingPoolResolver } from "./useStakingPoolResolver";

export const useStakingView = () => {
  const { isConnected, provider } = useConnection();
  const { poolId, exitLinkURI, poolLogoURI, poolName, mainnetAddress } =
    useStakingPoolResolver();

  const {
    isStakingDataLoading,
    stakingData,
    isWrongNetwork,
    isWrongNetworkHandler,
  } = useStakingActionsResolver();

  return {
    poolId,
    exitLinkURI,
    poolLogoURI,
    poolName,
    mainnetAddress,
    isStakingDataLoading: isStakingDataLoading,
    isWrongNetwork,
    isWrongNetworkHandler,
    stakingData,
    isConnected,
    provider,
    connectWalletHandler: onboard.init,
  };
};
