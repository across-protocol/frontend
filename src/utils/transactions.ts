import { ethers } from "ethers";

/**
 * This function takes a raw transaction and a signer and returns the result of signing the transaction.
 * @param tx The raw transaction to sign.
 * @param signer A signer used to sign the transaction
 * @returns The raw transaction signed by the given `signer`.
 */
export function signTransaction(
  rawTx: ethers.providers.TransactionRequest,
  signer: ethers.Signer
): Promise<string> {
  //TODO: here is where we might do safety checks on the transaction
  return signer.signTransaction(rawTx);
}

export async function sendSignedTransaction(
  signedTx: string,
  provider: ethers.providers.Provider
): Promise<ethers.providers.TransactionResponse> {
  const tx = await provider.sendTransaction(signedTx);
  return tx;
}
