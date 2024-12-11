import { utils } from 'ethers';
import { getProvider } from '@/utils/provider';

/**
 * Verify a relayer's configuration update signature and nonce
 * @param configPayload The configuration update payload
 * @param signature The signature provided by the relayer 
 * @param nonce The nonce value to prevent replay attacks
 * @throws Error if signature is invalid or nonce has been used
 */
export async function verifyRelayerSignature(
  configPayload: Record<string, any>,
  signature: string,
  nonce: number
): Promise<void> {
  try {
    // Verify nonce hasn't been used before
    if (await hasNonceBeenUsed(nonce)) {
      throw new Error('Nonce has already been used');
    }

    // Add nonce to payload before verifying
    const payloadWithNonce = {
      ...configPayload,
      nonce
    };

    // Convert payload to string and hash it
    const payloadStr = JSON.stringify(payloadWithNonce);
    const messageHash = utils.keccak256(utils.toUtf8Bytes(payloadStr));

    // Create signable message
    const prefixedMessage = utils.arrayify(messageHash);

    // Recover the address that signed the message
    const recoveredAddress = utils.verifyMessage(prefixedMessage, signature);
    const checksumAddress = utils.getAddress(recoveredAddress);

    // Verify signer is an authorized relayer
    if (!await isAuthorizedRelayer(checksumAddress)) {
      throw new Error('Signer is not an authorized relayer');
    }

    // Store nonce as used
    await storeUsedNonce(nonce);

  } catch (error) {
    console.error('Error verifying relayer signature:', error);
    throw error;
  }
}

// Helper functions that would need to be implemented:
async function hasNonceBeenUsed(nonce: number): Promise<boolean> {
  // Check if nonce exists in storage
  throw new Error('Not implemented');
}

async function isAuthorizedRelayer(address: string): Promise<boolean> {
  // Check if address is in authorized relayer list
  throw new Error('Not implemented'); 
}

async function storeUsedNonce(nonce: number): Promise<void> {
  // Store nonce in persistent storage
  throw new Error('Not implemented');
}