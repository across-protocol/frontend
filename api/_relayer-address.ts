import { constants, utils } from "@across-protocol/sdk";
import { ethers } from "ethers";

import { getEnvs } from "./_env";
import { HUB_POOL_CHAIN_ID } from "./_utils";

const {
  RELAYER_ADDRESS_OVERRIDES,
  REACT_APP_FULL_RELAYERS,
  FULL_RELAYERS_SVM,
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
  const chainIsSvm = utils.chainIsSvm(destinationChainId);
  const symbolOverride = symbol
    ? defaultRelayerAddressOverride?.symbols?.[symbol]
    : undefined;
  const overrideAddress =
    symbolOverride?.chains?.[destinationChainId] ?? // Specific Symbol/Chain override
    symbolOverride?.defaultAddr ?? // Specific Symbol override
    defaultRelayerAddressOverride?.defaultAddr; // Default override

  if (overrideAddress) {
    const overrideAddressType = utils.toAddressType(overrideAddress);
    if (chainIsSvm) {
      return overrideAddressType.isValidEvmAddress()
        ? constants.DEFAULT_SIMULATED_RELAYER_ADDRESS_SVM
        : overrideAddressType.toBase58();
    }
    return overrideAddressType.isValidEvmAddress()
      ? overrideAddressType.toEvmAddress()
      : constants.DEFAULT_SIMULATED_RELAYER_ADDRESS;
  }

  return chainIsSvm
    ? constants.DEFAULT_SIMULATED_RELAYER_ADDRESS_SVM
    : constants.DEFAULT_SIMULATED_RELAYER_ADDRESS;
}

/**
 * Returns a list of relayers that run a full auto-rebalancing strategy.
 * @returns A list of relayer addresses
 */
export function getFullRelayers(chainId: number = HUB_POOL_CHAIN_ID) {
  const chainIsSvm = utils.chainIsSvm(chainId);
  return chainIsSvm ? _getFullRelayersSvm() : _getFullRelayersEvm();
}

function _getFullRelayersEvm() {
  if (!REACT_APP_FULL_RELAYERS) {
    return [];
  }
  return (JSON.parse(REACT_APP_FULL_RELAYERS) as string[]).map((relayer) => {
    return ethers.utils.getAddress(relayer);
  });
}

function _getFullRelayersSvm() {
  if (!FULL_RELAYERS_SVM) {
    return [];
  }
  return (JSON.parse(FULL_RELAYERS_SVM) as string[]).map((relayer) => {
    return utils.toAddressType(relayer).toBase58();
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
  const chainIsSvm = utils.chainIsSvm(destinationChainId);
  const restrictedRelayers =
    transferRestrictedRelayers[destinationChainId]?.[symbol] ?? [];
  return restrictedRelayers.map((relayer) => {
    const relayerAddressType = utils.toAddressType(relayer);
    return chainIsSvm
      ? relayerAddressType.toBase58()
      : relayerAddressType.toEvmAddress();
  });
}
