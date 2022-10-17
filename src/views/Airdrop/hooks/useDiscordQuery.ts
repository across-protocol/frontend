import { useQuery } from "react-query";
import { prelaunchUserDetailsQueryKey } from "utils";
import getApiEndpoint from "utils/serverless-api";

export function useDiscordQuery(jwt?: string) {
  const queryKey = jwt
    ? prelaunchUserDetailsQueryKey(jwt)
    : "DISABLED_DISCORD_DETAILS_KEY";

  const { data, ...other } = useQuery(queryKey, async () => {
    if (jwt) {
      return getApiEndpoint().prelaunch.discordUserDetails(jwt);
    }
  });

  return {
    userDiscordDetails: data,
    ...other,
  };
}
