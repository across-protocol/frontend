import axios from "axios";
import { rewardsApiUrl } from "utils/constants";
import getApiEndpoint from "..";

export async function retrieveDiscordUserDetails(backendJWT: string): Promise<{
  discordId: string;
  discordName: string;
  discordAvatar: string;
  walletLinked?: string;
}> {
  // Call to scraper API and resolve the JWT
  const jwtResolver = await axios.get<{
    user: {
      discordId: string;
      discordName: string;
      discordAvatar: string;
    };
  }>(`${rewardsApiUrl}/users/me`, {
    headers: {
      Authorization: `Bearer ${backendJWT}`,
    },
  });
  const walletLinked =
    await getApiEndpoint().prelaunch.linkedWallet(backendJWT);
  return {
    discordId: jwtResolver.data.user.discordId,
    discordName: jwtResolver.data.user.discordName,
    discordAvatar: jwtResolver.data.user.discordAvatar,
    walletLinked,
  };
}
