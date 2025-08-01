import { utils } from "@across-protocol/sdk";
import { CHAIN_IDs } from "./_constants";

export const DEFAULT_SIMULATED_RECIPIENT_ADDRESS_EVM = utils.toAddressType(
  "0xBb23Cd0210F878Ea4CcA50e9dC307fb0Ed65Cf6B",
  CHAIN_IDs.MAINNET
);

export const DEFAULT_SIMULATED_RECIPIENT_ADDRESS_SVM = utils.toAddressType(
  "GsiZqCTNRi4T3qZrixFdmhXVeA4CSUzS7c44EQ7Rw1Tw",
  CHAIN_IDs.SOLANA
);

export function getDefaultRecipientAddress(chainId: number) {
  if (utils.chainIsSvm(chainId)) {
    return DEFAULT_SIMULATED_RECIPIENT_ADDRESS_SVM.toBase58();
  }
  return DEFAULT_SIMULATED_RECIPIENT_ADDRESS_EVM.toEvmAddress();
}
