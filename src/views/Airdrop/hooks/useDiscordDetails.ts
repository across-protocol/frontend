import { useDiscord } from "hooks/useDiscord";
import { useOnboard } from "hooks/useOnboard";
import { useCallback, useEffect, useState } from "react";
import getApiEndpoint from "utils/serverless-api";
import { useDiscordQuery } from "./useDiscordQuery";

export function useDiscordDetails() {
  const { discordJWT, isAuthenticated } = useDiscord();
  const { signer } = useOnboard();

  const [id, setId] = useState<string | undefined>(undefined);
  const [name, setName] = useState<string | undefined>(undefined);
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [walletLinked, setWalletLinked] = useState<string | undefined>(
    undefined
  );
  const [discordDetailsLoading, setDiscordDetailsLoading] = useState(false);
  const [discordDetailsError, setDiscordDetailsError] = useState(false);

  const { userDiscordDetails, isLoading, isError } =
    useDiscordQuery(discordJWT);

  useEffect(() => {
    if (userDiscordDetails && isAuthenticated) {
      setId(userDiscordDetails.discordId);
      setName(userDiscordDetails.discordName);
      setAvatar(userDiscordDetails.discordAvatar);
      setWalletLinked(userDiscordDetails.walletLinked);
    } else {
      setId(undefined);
      setName(undefined);
      setAvatar(undefined);
      setWalletLinked(undefined);
    }
  }, [userDiscordDetails, isAuthenticated]);

  useEffect(() => {
    setDiscordDetailsError((e) => e || isError);
  }, [isError]);

  useEffect(() => {
    setDiscordDetailsLoading((l) => l || isLoading);
  }, [isLoading]);

  const linkWallet = useCallback(async () => {
    let successfullyLinked = true;
    if (signer && discordJWT && id) {
      setDiscordDetailsLoading(true);
      try {
        const linked = await getApiEndpoint().prelaunch.connectWallet(
          discordJWT,
          id,
          signer
        );
        if (linked) {
          setWalletLinked(await signer.getAddress());
        } else {
          successfullyLinked = false;
        }
      } catch (_e) {
        successfullyLinked = false;
      } finally {
        setDiscordDetailsLoading(false);
      }
    }
    return successfullyLinked;
  }, [signer, discordJWT, id]);

  return {
    discordId: id,
    discordName: name,
    discordAvatar: avatar,
    linkWalletHandler: linkWallet,
    linkedWallet: walletLinked,
    discordDetailsLoading,
    discordDetailsError,
  };
}
