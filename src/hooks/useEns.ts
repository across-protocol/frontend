import { useQuery } from "@tanstack/react-query";

import { ChainId, getProvider } from "utils";

export function useEnsQuery(address: string) {
  return useQuery({
    queryKey: ["ens", address],
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
  });
}
