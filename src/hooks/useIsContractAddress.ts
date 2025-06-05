import { useQuery } from "@tanstack/react-query";
import { isAddress } from "viem";
import { getCode, noContractCode } from "utils";

export function useIsContractAddress(
  address?: string,
  chainId = 1,
  ignore7702 = false
) {
  const result = useQuery({
    queryKey: ["isContractAddress", address, chainId, ignore7702],
    queryFn: async () => {
      if (!address || !chainId) return false;
      const code = await getCode(address, chainId);

      if (code === noContractCode) {
        return false;
      }

      // Ignore EIP-7702 delegations if ignore7702 was set.
      if (ignore7702) {
        return !is7702Delegate(code);
      }

      return true;
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

export function is7702Delegate(code: string): boolean {
  // Sample 7702 delegation bytecode: 0xef010063c0c19a282a1b52b07dd5a65b58948a07dae32b
  return (
    code.length === 48 &&
    code.startsWith("0xef0100") &&
    isAddress(`0x${code.slice(8)}`)
  );
}
