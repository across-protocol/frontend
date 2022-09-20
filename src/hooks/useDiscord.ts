import { useCallback } from "react";
import { discordClientId } from "utils";

export function useDiscord() {
  const redirectToAuth = useCallback(() => {
    const queryString = new URLSearchParams({
      client_id: discordClientId,
      redirect_uri: `${window.location.origin}/auth/discord`,
      response_type: "code",
      scope: "identify",
    }).toString();
    const url = `https://discord.com/api/oauth2/authorize?${queryString}`;
    window.location.replace(url);
  }, []);

  return {
    redirectToAuth,
  };
}
