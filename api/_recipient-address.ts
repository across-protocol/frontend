import { utils } from "@across-protocol/sdk";

export const DEFAULT_SIMULATED_RECIPIENT_ADDRESS_EVM = utils.toAddressType(
  "0xBb23Cd0210F878Ea4CcA50e9dC307fb0Ed65Cf6B"
);

export const DEFAULT_SIMULATED_RECIPIENT_ADDRESS_SVM = utils.toAddressType(
  "GsiZqCTNRi4T3qZrixFdmhXVeA4CSUzS7c44EQ7Rw1Tw"
);

export function getDefaultRecipientAddress(chainId: number) {
  if (utils.chainIsSvm(chainId)) {
    return DEFAULT_SIMULATED_RECIPIENT_ADDRESS_SVM.toBase58();
  }
  return DEFAULT_SIMULATED_RECIPIENT_ADDRESS_EVM.toEvmAddress();
}
