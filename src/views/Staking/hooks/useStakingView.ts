import { useConnection } from "state/hooks";
import { onboard } from "utils";
import { useStakingClaimRewards } from "./useStakingClaimRewards";
import { useStakingPoolResolver } from "./useStakingPoolResolver";

export const useStakingView = () => {
  const { isConnected, provider } = useConnection();
  const poolInformation = useStakingPoolResolver();

  //FIXME: Redirect to 404 prior to continuing

  // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

  const stakingData = useStakingClaimRewards();

  return {
    ...poolInformation,
    ...stakingData,
    isConnected: isConnected,
    provider: provider,
    connectWalletHandler: onboard.init,
  };
};
