import { ethers, utils } from "ethers";
import { getEnvs } from "../../../../api/_env";

let sponsorshipSigner: ethers.Wallet | undefined;

/**
 * Retrieves the sponsorship signer wallet instance.
 * This function caches the signer instance in memory to avoid re-creating it on every call.
 * The private key for the signer is fetched from environment variables.
 * @returns {ethers.Wallet} The sponsorship signer wallet instance.
 * @throws {Error} If the SPONSORSHIP_SIGNER_PRIVATE_KEY environment variable is not set.
 */
export const getSponsorshipSigner = (): ethers.Wallet => {
  if (sponsorshipSigner) return sponsorshipSigner;

  const { SPONSORSHIP_SIGNER_PRIVATE_KEY } = getEnvs();
  if (!SPONSORSHIP_SIGNER_PRIVATE_KEY) {
    throw new Error("SPONSORSHIP_SIGNER_PRIVATE_KEY is not set");
  }
  sponsorshipSigner = new ethers.Wallet(SPONSORSHIP_SIGNER_PRIVATE_KEY);
  return sponsorshipSigner;
};

/**
 * Signs a raw digest with the sponsorship signer.
 * This is used for CCTP signatures where the contract expects a signature on the unprefixed hash.
 * @param {string} digest The raw digest to sign.
 * @returns {string} The signature string.
 */
export const signDigestWithSponsor = (digest: string): string => {
  const signer = getSponsorshipSigner();
  // We use `_signingKey().signDigest` to sign the raw digest, as this is what the CCTP contract expects.
  // This is necessary because `signer.signMessage` would prefix the hash.
  const signature = signer._signingKey().signDigest(digest);
  return utils.joinSignature(signature);
};

/**
 * Signs a message with the sponsorship signer.
 * This is used for OFT signatures where the contract expects a signature on the EIP-191 prefixed hash.
 * @param {Uint8Array} message The message to sign.
 * @returns {Promise<string>} The signature string.
 */
export const signMessageWithSponsor = (
  message: Uint8Array
): Promise<string> => {
  const signer = getSponsorshipSigner();
  return signer.signMessage(message);
};
