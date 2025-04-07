import { constants } from "@across-protocol/sdk";
import { getEnvs } from "./_env";
import { ethers } from "ethers";

const {
  RELAYER_ADDRESS_OVERRIDES,
  REACT_APP_FULL_RELAYERS,
  TRANSFER_RESTRICTED_RELAYERS,
} = getEnvs();

export const defaultRelayerAddressOverride: {
  defaultAddr?: string;
  symbols?: {
    [symbol: string]: {
      defaultAddr?: string;
      chains?: { [chainId: string]: string };
    };
  };
} = JSON.parse(RELAYER_ADDRESS_OVERRIDES || "{}");

const transferRestrictedRelayers: {
  [destinationChainId: string]: {
    [symbol: string]: string[];
  };
} = JSON.parse(TRANSFER_RESTRICTED_RELAYERS || "{}");

/**
 * Returns the EOA that will serve as the default relayer address for simulated deposits.
 * @param destinationChainId The destination chain that a bridge operation will transfer to
 * @param symbol A valid token symbol
 * @returns A valid EOA address
 */
export function getDefaultRelayerAddress(
  destinationChainId: number,
  symbol?: string
) {
  const symbolOverride = symbol
    ? defaultRelayerAddressOverride?.symbols?.[symbol]
    : undefined;
  return (
    symbolOverride?.chains?.[destinationChainId] ?? // Specific Symbol/Chain override
    symbolOverride?.defaultAddr ?? // Specific Symbol override
    defaultRelayerAddressOverride?.defaultAddr ?? // Default override
    constants.DEFAULT_SIMULATED_RELAYER_ADDRESS // Default hardcoded value
  );
}

/**
 * Returns a list of relayers that run a full auto-rebalancing strategy.
 * @returns A list of relayer addresses
 */
export function getFullRelayers() {
  if (!REACT_APP_FULL_RELAYERS) {
    return [];
  }
  return (JSON.parse(REACT_APP_FULL_RELAYERS) as string[]).map((relayer) => {
    return ethers.utils.getAddress(relayer);
  });
}

/**
 * Returns a list of relayers that do not run a full auto-rebalancing strategy.
 * @param destinationChainId The destination chain that a bridge operation will transfer to
 * @param symbol A valid token symbol
 * @returns A list of relayer addresses
 */
export function getTransferRestrictedRelayers(
  destinationChainId: number,
  symbol: string
) {
  const restrictedRelayers =
    transferRestrictedRelayers[destinationChainId]?.[symbol] ?? [];
  return restrictedRelayers.map((relayer) => {
    return ethers.utils.getAddress(relayer);
  });
}
