import axios, { AxiosError } from "axios";
import { rewardsApiUrl } from "utils/constants";

export async function retrieveLinkedWallet(
  backendJWT: string
): Promise<string | undefined> {
  try {
    // Resolve whether the user has a wallet
    const response = await axios.get<{ walletAddress: string }>(
      `${rewardsApiUrl}/users/me/wallets`,
      {
        headers: {
          Authorization: `Bearer ${backendJWT}`,
        },
      }
    );
    return response.data.walletAddress;
  } catch (e: unknown) {
    // Test for the case where this function returns a 404
    // and if this is not that error, then propagate `e`
    if (
      !(
        e instanceof AxiosError &&
        e.response?.data.error === "WalletNotFoundException"
      )
    ) {
      throw e;
    }
  }
}
