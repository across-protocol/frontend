import { BigNumberish, utils } from "ethers";
import { signDigestWithSponsor } from "../../_sponsorship-signature";

/**
 * Represents the parameters for a sponsored CCTP quote.
 * This structure is signed by the sponsor and validated by the destination contract.
 * For more details on the struct, see the original contract:
 * @see https://github.com/across-protocol/contracts/blob/1d645f90062e1e7acf5db995647264ddbca07da9/contracts/libraries/SponsoredCCTPQuoteLib.sol
 */
export interface SponsoredCCTPQuote {
  sourceDomain: number;
  destinationDomain: number;
  mintRecipient: string;
  amount: BigNumberish;
  burnToken: string;
  destinationCaller: string;
  maxFee: BigNumberish;
  minFinalityThreshold: number;
  nonce: string;
  deadline: BigNumberish;
  maxBpsToSponsor: BigNumberish;
  maxUserSlippageBps: BigNumberish;
  finalRecipient: string;
  finalToken: string;
}

/**
 * Creates a signature for a sponsored CCTP quote.
 * The signing process follows the `validateSignature` function in the `SponsoredCCTPQuoteLib` contract.
 * It involves creating two separate hashes of the quote data, combining them, and then signing the final hash.
 * This is done to avoid stack too deep errors in the Solidity contract.
 * @param {SponsoredCCTPQuote} quote The sponsored CCTP quote to sign.
 * @returns {{ signature: string; typedDataHash: string }} An object containing the signature and the typed data hash that was signed.
 * @see https://github.com/across-protocol/contracts/blob/1d645f90062e1e7acf5db995647264ddbca07da9/contracts/libraries/SponsoredCCTPQuoteLib.sol
 */
export const createCctpSignature = (
  quote: SponsoredCCTPQuote
): { signature: string; typedDataHash: string } => {
  // The hashing is split into two parts to match the contract's implementation,
  // which does this to prevent a "stack too deep" error in Solidity.
  const hash1 = utils.keccak256(
    utils.defaultAbiCoder.encode(
      [
        "uint32",
        "uint32",
        "bytes32",
        "uint256",
        "bytes32",
        "bytes32",
        "uint256",
        "uint32",
      ],
      [
        quote.sourceDomain,
        quote.destinationDomain,
        quote.mintRecipient,
        quote.amount,
        quote.burnToken,
        quote.destinationCaller,
        quote.maxFee,
        quote.minFinalityThreshold,
      ]
    )
  );

  const hash2 = utils.keccak256(
    utils.defaultAbiCoder.encode(
      ["bytes32", "uint256", "uint256", "uint256", "bytes32", "bytes32"],
      [
        quote.nonce,
        quote.deadline,
        quote.maxBpsToSponsor,
        quote.maxUserSlippageBps,
        quote.finalRecipient,
        quote.finalToken,
      ]
    )
  );

  // The two hashes are then combined and hashed again to produce the final digest to be signed.
  const typedDataHash = utils.keccak256(
    utils.defaultAbiCoder.encode(["bytes32", "bytes32"], [hash1, hash2])
  );

  const signature = signDigestWithSponsor(typedDataHash);
  return { signature, typedDataHash };
};
