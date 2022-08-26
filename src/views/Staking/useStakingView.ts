import { useParams } from "react-router";
import { useConnection } from "state/hooks";
import { onboard, tokenList } from "utils";

type StakingPathParams = {
  poolId: string;
};

export const useStakingView = () => {
  const { poolId } = useParams<StakingPathParams>();
  const { isConnected } = useConnection();
  const { init } = onboard;

  return {
    poolId,
    exitLinkURI: "/rewards",
    poolLogoURI: tokenList[8].logoURI,
    poolName: "USDC",
    amountOfRewardsClaimable: 320.13,
    isConnected: isConnected,
    walletConnectionHandler: init,
  };
};
