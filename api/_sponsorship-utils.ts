import { BigNumber, utils } from "ethers";

import { Token } from "./_dexes/types";
import { toBytes32 } from "./_address";
import { CHAIN_IDs } from "./_constants";

/**
 * Parameters for building a sponsored quote
 */
export type BuildSponsoredQuoteParams = {
  inputToken: Token;
  outputToken: Token;
  inputAmount: BigNumber;
  recipient: string;
  depositor: string;
  refundRecipient: string;
  maxBpsToSponsor: BigNumber;
  maxUserSlippageBps: number;
};

/**
 * Execution modes for destination handler
 * Must match the ExecutionMode enum in the destination contract
 */
export enum ExecutionMode {
  Default = 0, // Default HyperCore flow
  ArbitraryActionsToCore = 1, // Execute arbitrary actions then transfer to HyperCore
  ArbitraryActionsToEVM = 2, // Execute arbitrary actions then stay on EVM
}

/**
 * Address of the donation box contract on HyperEVM
 */
export const DONATION_BOX_ADDRESS = {
  [CHAIN_IDs.HYPEREVM]: "0xbC217096db9EB6d2782c1d9E725D462077a4d1f6",
  // TODO: Add testnet donation box address
  [CHAIN_IDs.HYPEREVM_TESTNET]: "0x0000000000000000000000000000000000000000",
};

/**
 * Map of destination chain to the sponsored chain, i.e. the EVM chain where the
 * sponsorships are recorded.
 */
export const SPONSORED_CHAIN_ID_PER_DST_CHAIN_ID = {
  [CHAIN_IDs.HYPERCORE]: CHAIN_IDs.HYPEREVM,
  [CHAIN_IDs.HYPERCORE_TESTNET]: CHAIN_IDs.HYPEREVM_TESTNET,
  [CHAIN_IDs.HYPEREVM]: CHAIN_IDs.HYPEREVM,
  [CHAIN_IDs.HYPEREVM_TESTNET]: CHAIN_IDs.HYPEREVM_TESTNET,
};

/**
 * Default quote expiry time (15 minutes)
 */
export const DEFAULT_QUOTE_EXPIRY_SECONDS = 15 * 60;

/**
 * Generates a unique nonce for a quote
 * Uses keccak256 hash of timestamp in milliseconds + depositor address
 */
export function generateQuoteNonce(depositor: string): string {
  const timestamp = Date.now();
  const encoded = utils.defaultAbiCoder.encode(
    ["uint256", "bytes32"],
    [timestamp, toBytes32(depositor)]
  );
  return utils.keccak256(encoded);
}

/**
 * Gets the sponsored EVM chain ID for a destination chain. E.g. for HyperCore, it will return HyperEVM.
 * @param dstChainId - The destination chain ID.
 * @returns The sponsored EVM chain ID.
 */
export function getSponsoredEvmChainId(dstChainId: number) {
  const sponsoredChainId = SPONSORED_CHAIN_ID_PER_DST_CHAIN_ID[dstChainId];
  if (!sponsoredChainId) {
    throw new Error(`Destination chain ${dstChainId} is not sponsored`);
  }
  return sponsoredChainId;
}

/**
 * Gets the donation box address for a destination chain.
 * @param dstChainId - The destination chain ID.
 * @returns The donation box address.
 */
export function getDonationBoxAddress(dstChainId: number) {
  const sponsoredChainId = getSponsoredEvmChainId(dstChainId);
  const donationBoxAddress = DONATION_BOX_ADDRESS[sponsoredChainId];
  if (!donationBoxAddress) {
    throw new Error(
      `Donation box address not found for chain ${sponsoredChainId}`
    );
  }
  return donationBoxAddress;
}
