import { useQuery } from "react-query";

import { ChainId, getProvider } from "utils";

export function useEnsQuery(address: string) {
  return useQuery(
    ["ens", address],
    async () => {
      const provider = getProvider(ChainId.MAINNET);
      const [ensName, avatar] = await Promise.all([
        provider.lookupAddress(address),
        provider.getAvatar(address),
      ]);
      return { ensName, avatar };
    },
    {
      staleTime: Infinity,
    }
  );
}
