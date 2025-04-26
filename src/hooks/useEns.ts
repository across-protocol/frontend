import { useQuery } from "@tanstack/react-query";

import { ChainId, getProvider, isDefined } from "utils";

export function useEnsQuery(address?: string) {
  const result = useQuery({
    queryKey: ["ens", address] as [string, string],
    queryFn: async ({ queryKey }) => {
      const [, addressToQuery] = queryKey;
      const provider = getProvider(ChainId.MAINNET);
      const [ensName, avatar] = await Promise.all([
        provider.lookupAddress(addressToQuery),
        provider.getAvatar(addressToQuery),
      ]);
      return { ensName, avatar };
    },
    staleTime: Infinity,
    enabled: isDefined(address),
  });

  const resolvedData = isDefined(result.data)
    ? result.data
    : { ensName: null, avatar: null };

  return {
    ...result,
    data: resolvedData,
  };
}
