import { useParams } from "react-router";

type PoolRewardsPathParams = {
  poolId: string;
};

export const usePoolRewardsView = () => {
  let { poolId } = useParams<PoolRewardsPathParams>();

  return {
    poolId,
  };
};
