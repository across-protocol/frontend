import { useQuery } from "react-query";
import { prelaunchUserDetailsQueryKey } from "utils";
import getApiEndpoint from "utils/serverless-api";

export function useDiscordQuery(jwt?: string) {
  const queryKey = jwt
    ? prelaunchUserDetailsQueryKey()
    : "DISABLED_DISCORD_DETAILS_KEY";

  const { data, ...other } = useQuery(
    queryKey,
    async () => {
      if (jwt) {
        return getApiEndpoint().prelaunch.discordUserDetails(jwt);
      }
    },
    {
      // refetch based on the chain polling interval
      // disable this temporary
      // refetchInterval: 60000,
      enabled: !!jwt,
    }
  );

  return {
    userDiscordDetails: data,
    ...other,
  };
}
