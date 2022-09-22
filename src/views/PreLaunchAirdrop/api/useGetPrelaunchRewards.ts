import { useQuery } from "react-query";
import { prelaunchDataQueryKey } from "utils";
import getPrelaunchRewards from "./getPrelaunchRewards";

export function useGetPrelaunchRewards(address?: string) {
  const queryKey = !!address
    ? prelaunchDataQueryKey(address)
    : "DISABLED_ADDRESS_SUMMARY_KEY";

  const { data, ...other } = useQuery(
    queryKey,
    async () => {
      return getPrelaunchRewards(address!);
    },
    {
      // refetch based on the chain polling interval
      // disable this temporary
      // refetchInterval: 60000,
      enabled: !!address,
    }
  );

  console.log("data", data);
  return {
    rewarsData: data || {},
    ...other,
  };
}
