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

// Taken by calling `donationBox` on the dst handler contracts:
// - OFT: https://hyperevmscan.io/address/0xc8786d517b4e224bb43985a38dbef8588d7354cd#code
// - CCTP: https://hyperevmscan.io/address/0x1c709Fd0Db6A6B877Ddb19ae3D485B7b4ADD879f#code
const DONATION_BOX_ADDRESS_PER_DST_HANDLER: Record<
  "oft" | "cctp",
  Record<number, string>
> = {
  oft: {
    [CHAIN_IDs.HYPEREVM]: "0x3D589D40312Bf2d20f13cD0AF26A11144a9cA844",
  },
  cctp: {
    [CHAIN_IDs.HYPEREVM]: "0x039d62C549F27ead0eB9B567d8776289e5020583",
  },
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
export function getDonationBoxAddress(
  dstChainId: number,
  oftOrCctp: "oft" | "cctp"
) {
  const sponsoredChainId = getSponsoredEvmChainId(dstChainId);
  const donationBoxAddress =
    DONATION_BOX_ADDRESS_PER_DST_HANDLER[oftOrCctp][sponsoredChainId];
  if (!donationBoxAddress) {
    throw new Error(
      `Donation box address not found for ${oftOrCctp} on chain ${dstChainId}`
    );
  }
  return donationBoxAddress;
}
