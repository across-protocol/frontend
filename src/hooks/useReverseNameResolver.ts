import { useQuery } from "@tanstack/react-query";

import { ChainId } from "utils/constants";
import { getProvider } from "utils/providers";
import { isDefined } from "utils/sdk";
import { reverseResolveHyperliquid } from "./useNameResolver/resolvers/hyperliquid";

export function useReverseNameResolver(address: string | undefined) {
  const ensQuery = useQuery({
    queryKey: ["ens", address] as const,
    queryFn: async ({ queryKey }) => {
      const [, addressToQuery] = queryKey;
      const provider = getProvider(ChainId.MAINNET);
      const [ensName, avatar] = await Promise.all([
        provider.lookupAddress(addressToQuery!),
        provider.getAvatar(addressToQuery!),
      ]);
      return { ensName, avatar };
    },
    staleTime: Infinity,
    enabled: isDefined(address),
  });

  const hlQuery = useQuery({
    queryKey: ["hlName", address] as const,
    queryFn: async ({ queryKey }) => {
      const [, addressToQuery] = queryKey;
      return reverseResolveHyperliquid(addressToQuery!);
    },
    staleTime: Infinity,
    enabled: isDefined(address),
  });

  const ensData = ensQuery.data ?? { ensName: null, avatar: null };

  return {
    ensName: ensData.ensName,
    ensAvatar: ensData.avatar,
    hlName: hlQuery.data ?? null,
    isLoading: ensQuery.isLoading || hlQuery.isLoading,
  };
}
