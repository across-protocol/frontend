import axios from "axios";
import { providers } from "ethers";
import { rewardsApiUrl } from "utils/constants";
import getApiEndpoint from "..";

export async function connectLinkedWallet(
  backendJWT: string,
  discordId: string,
  signer: providers.JsonRpcSigner
): Promise<boolean> {
  try {
    const walletLinked =
      (await getApiEndpoint().prelaunch.linkedWallet(backendJWT)) !== undefined;

    const signature = await signer.signMessage(discordId);
    const walletAddress = await signer.getAddress();
    // Set wallet address
    await axios({
      url: `${rewardsApiUrl}/users/me/wallets`,
      method: walletLinked ? "patch" : "post",
      headers: {
        Authorization: `Bearer ${backendJWT}`,
      },
      data: {
        signature,
        walletAddress,
        discordId,
      },
    });
    return true;
  } catch (_e: unknown) {
    return false;
  }
}
