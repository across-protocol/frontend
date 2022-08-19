import { useParams } from "react-router";
import { tokenList } from "utils";

type StakingPathParams = {
  poolId: string;
};

export const useStakingView = () => {
  let { poolId } = useParams<StakingPathParams>();

  return {
    poolId,
    exitLinkURI: "/rewards",
    poolLogoURI: tokenList[0].logoURI,
  };
};
