import { useParams } from "react-router";

type StakingPathParams = {
  poolId: string;
};

export const useStakingView = () => {
  let { poolId } = useParams<StakingPathParams>();

  return {
    poolId,
  };
};
