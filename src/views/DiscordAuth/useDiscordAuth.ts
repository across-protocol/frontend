import axios from "axios";
import { useDiscord } from "hooks/useDiscord";
import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { rewardsApiUrl } from "utils";

export default function useDiscordAuth() {
  const [errorAuthenticating, setErrorAuthenticating] =
    useState<boolean>(false);
  const { discordOAuthToken, hasOAuthToken, isAuthenticated, authenticate } =
    useDiscord();
  const history = useHistory();

  useEffect(() => {
    handleDiscordAuthHookLogic(
      isAuthenticated,
      authenticate,
      hasOAuthToken,
      discordOAuthToken
    )
      .then((authenticated) => {
        if (authenticated) {
          history.push("/airdrop");
        }
      })
      .catch(() => {
        setErrorAuthenticating(true);
      });
  }, [
    authenticate,
    discordOAuthToken,
    hasOAuthToken,
    history,
    isAuthenticated,
  ]);

  return {
    errorAuthenticating,
  };
}

const handleDiscordAuthHookLogic = async (
  isAuthenticated: boolean,
  authenticate: (jwt: string) => void,
  hasOAuthToken?: boolean,
  discordOAuthToken?: string
) => {
  if (isAuthenticated) {
    return true;
  } else if (typeof hasOAuthToken !== "undefined") {
    if (hasOAuthToken) {
      if (discordOAuthToken) {
        // Call to scraper API and resolve the JWT
        const jwtResolver = await axios.get<{ jwt: string }>(
          `${rewardsApiUrl}/auth/discord`,
          {
            params: {
              code: discordOAuthToken,
            },
          }
        );
        authenticate(jwtResolver.data.jwt);
        // Simulate a 3 second load
        await new Promise((r) => setTimeout(r, 3000));
      } else {
        // NOOP do nothing.
        return false;
      }
    } else {
      throw Error();
    }
  }
};
