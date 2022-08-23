import { useParams } from "react-router";
import { tokenList } from "utils";

type StakingPathParams = {
  poolId: string;
};

export const useStakingView = () => {
  const { poolId } = useParams<StakingPathParams>();

  return {
    poolId,
    exitLinkURI: "/rewards",
    poolLogoURI: tokenList[8].logoURI,
    poolName: "USDC",
    amountOfRewardsClaimable: 320.13,
  };
};
