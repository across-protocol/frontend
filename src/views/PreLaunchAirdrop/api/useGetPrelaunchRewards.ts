import { useQuery } from "react-query";
import { prelaunchDataQueryKey } from "utils";
import { RewardsApiInterface } from "utils/serverless-api/types";
import getPrelaunchRewards from "./getPrelaunchRewards";

export function useGetPrelaunchRewards(address?: string, jwt?: string) {
  const queryKey = prelaunchDataQueryKey(address, jwt);

  const { data, ...other } = useQuery(
    queryKey,
    async () => {
      return getPrelaunchRewards(address!, jwt);
    },
    {
      enabled: !!address,
    }
  );

  return {
    rewardsData: data || ({} as RewardsApiInterface),
    ...other,
  };
}
