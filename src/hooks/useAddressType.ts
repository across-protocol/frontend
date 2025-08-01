import { useQuery } from "@tanstack/react-query";
import { isAddress } from "viem";
import { getCode, noContractCode } from "utils";

export const AddressTypes = {
  contract: "contract",
  "7702Delegate": "7702Delegate",
  EOA: "EOA",
  EOA_SVM: "EOA_SVM",
} as const;

export type AddressType = (typeof AddressTypes)[keyof typeof AddressTypes];

export function useAddressType(address?: string, chainId = 1): AddressType {
  const result = useQuery({
    queryKey: ["addressType", address, chainId],
    queryFn: async (): Promise<AddressType> => {
      try {
        if (!address || !chainId) return AddressTypes.EOA;
        const code = await getCode(address, chainId);

        if (code === noContractCode) {
          return AddressTypes.EOA;
        }
        if (is7702Delegate(code)) {
          return AddressTypes["7702Delegate"];
        }

        return AddressTypes.contract;
      } catch (e) {
        console.warn(
          `Unable to get code at address ${address} on chain ${chainId}`
        );
        // defaults to an EOA
        return AddressTypes.EOA;
      }
    },
    enabled: Boolean(address && chainId),
    // we don't expect this to change for a given address, cache heavily
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return result.data ?? AddressTypes.EOA;
}

export function is7702Delegate(code: string): boolean {
  // Sample 7702 delegation bytecode: 0xef010063c0c19a282a1b52b07dd5a65b58948a07dae32b
  return (
    code.length === 48 &&
    code.startsWith("0xef0100") &&
    isAddress(`0x${code.slice(8)}`)
  );
}
