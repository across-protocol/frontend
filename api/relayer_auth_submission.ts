import { utils } from 'ethers';
import { getProvider } from '@/utils/provider';

/**
 * Get the address that signed a configuration update
 * @param configPayload The configuration update payload
 * @param signature The signature provided by the relayer
 * @returns The Ethereum address that signed the payload
 */
export async function getSignerAddress(
  configPayload: Record<string, any>,
  signature: string
): Promise<string> {
  try {
    // Convert payload to string and hash it
    const payloadStr = JSON.stringify(configPayload);
    const messageHash = utils.keccak256(utils.toUtf8Bytes(payloadStr));

    // Create signable message
    const prefixedMessage = utils.arrayify(messageHash);

    // Recover the address that signed the message
    const recoveredAddress = utils.verifyMessage(prefixedMessage, signature);

    // Convert to checksum format
    return utils.getAddress(recoveredAddress);

  } catch (error) {
    console.error('Error recovering signer address:', error);
    throw error;
  }
}