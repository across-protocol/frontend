import { useQuery } from "@tanstack/react-query";
import { getCode, noContractCode } from "utils";

export function useIsContractAddress(address?: string, chainId = 1) {
  const result = useQuery({
    queryKey: ["isContractAddress", address, chainId],
    queryFn: async () => {
      if (!address || !chainId) return false;
      const code = await getCode(address, chainId);
      return code !== noContractCode;
    },
    enabled: Boolean(address && chainId),
    // we don't expect this change for a given address, cache heavily
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return result.data ?? false;
}
