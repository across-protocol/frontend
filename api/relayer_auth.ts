import { ethers } from 'ethers';

/**
 * Get the address that signed a configuration update
 * @param configPayload The configuration update payload
 * @param signature The signature provided by the relayer
 * @returns The Ethereum address that signed the payload
 */
async function getSignerAddress(
  configPayload: Record<string, any>,
  signature: string
): Promise<string> {
  try {
    // Convert payload to string and hash it
    const payloadStr = JSON.stringify(configPayload);
    const messageHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(payloadStr));

    // Create signable message
    const prefixedMessage = ethers.utils.arrayify(messageHash);

    // Recover the address that signed the message
    const recoveredAddress = ethers.utils.verifyMessage(prefixedMessage, signature);

    // Convert to checksum format
    return ethers.utils.getAddress(recoveredAddress);

  } catch (error) {
    console.error('Error recovering signer address:', error);
    throw error;
  }
}