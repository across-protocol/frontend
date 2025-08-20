import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { isAddress as isEVMAddress } from "viem";
import { isAddress as isSVMAddress } from "@solana/kit";
import { chainIsSvm, getCode, isProgram, noContractCode } from "utils";

export const AddressTypes = {
  contract: "contract",
  "7702Delegate": "7702Delegate",
  EOA: "EOA",
  EOA_SVM: "EOA_SVM",
} as const;

export type AddressType = (typeof AddressTypes)[keyof typeof AddressTypes];

export function useAddressType(
  address?: string,
  chainId = 1,
  options: Partial<UseQueryOptions> = {
    enabled: true,
  }
): AddressType {
  const result = useQuery({
    queryKey: ["addressType", address, chainId],
    queryFn: async (): Promise<AddressType> => {
      try {
        if (!address || !chainId) return AddressTypes.EOA;
        if (chainIsSvm(chainId)) {
          // SVM
          if (!isSVMAddress(address)) {
            throw new Error(`Address ${address} is not a valid SVM address`);
          }
          const executable = await isProgram(address, chainId);
          return executable ? AddressTypes.contract : AddressTypes.EOA; // no 7702
        }
        // EVM
        if (!isEVMAddress(address)) {
          throw new Error(`Address ${address} is not a valid EVM address`);
        }
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
          `Unable to get code at address ${address} on chain ${chainId}`,
          {
            cause: e,
          }
        );
        // defaults to an EOA
        return AddressTypes.EOA;
      }
    },
    enabled: Boolean(address && chainId && options.enabled),
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
    isEVMAddress(`0x${code.slice(8)}`)
  );
}
