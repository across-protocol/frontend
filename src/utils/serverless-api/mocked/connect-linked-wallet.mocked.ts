import { providers } from "ethers";

export async function connectLinkedWalletMockedCall(
  _backendJWT: string,
  _discordId: string,
  _signer: providers.JsonRpcSigner
): Promise<boolean> {
  return true;
}
