import { BigNumberish, utils } from "ethers";
import { signMessageWithSponsor } from "./utils";

/**
 * Represents the signed parameters of a sponsored OFT quote.
 * This structure is signed by the sponsor and validated by the destination contract.
 * For more details on the struct, see the original contract:
 * @see https://github.com/across-protocol/contracts/blob/7b37bbee4e8c71f2d3cffb28defe1c1e26583cb0/contracts/periphery/mintburn/sponsored-oft/Structs.sol
 */
export interface SignedQuoteParams {
  srcEid: number;
  dstEid: number;
  destinationHandler: string;
  amountLD: BigNumberish;
  nonce: string;
  deadline: BigNumberish;
  maxBpsToSponsor: BigNumberish;
  finalRecipient: string;
  finalToken: string;
  lzReceiveGasLimit: BigNumberish;
  lzComposeGasLimit: BigNumberish;
}

/**
 * Creates a signature for a sponsored OFT quote.
 * The signing process follows the `validateSignature` function in the `QuoteSignLib` contract.
 * It involves ABI-encoding all the parameters, hashing the result, and then signing the EIP-191 prefixed hash.
 * @param quote The sponsored OFT quote parameters to sign.
 * @returns A promise that resolves to an object containing the signature and the hash that was signed.
 * @see https://github.com/across-protocol/contracts/blob/7b37bbee4e8c71f2d3cffb28defe1c1e26583cb0/contracts/periphery/mintburn/sponsored-oft/QuoteSignLib.sol
 */
export const createOftSignature = async (
  quote: SignedQuoteParams
): Promise<{ signature: string; hash: string }> => {
  // ABI-encode all parameters and hash the result to create the digest to be signed.
  const encodedData = utils.defaultAbiCoder.encode(
    [
      "uint32",
      "uint32",
      "bytes32",
      "uint256",
      "bytes32",
      "uint256",
      "uint256",
      "bytes32",
      "bytes32",
      "uint256",
      "uint256",
    ],
    [
      quote.srcEid,
      quote.dstEid,
      quote.destinationHandler,
      quote.amountLD,
      quote.nonce,
      quote.deadline,
      quote.maxBpsToSponsor,
      quote.finalRecipient,
      quote.finalToken,
      quote.lzReceiveGasLimit,
      quote.lzComposeGasLimit,
    ]
  );

  const hash = utils.keccak256(encodedData);
  // The OFT contract expects an EIP-191 compliant signature, so we sign the prefixed hash of the digest.
  const signature = await signMessageWithSponsor(utils.arrayify(hash));
  return { signature, hash };
};
