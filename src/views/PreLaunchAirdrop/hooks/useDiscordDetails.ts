import { useDiscord } from "hooks/useDiscord";
import { useOnboard } from "hooks/useOnboard";
import { useCallback, useEffect, useState } from "react";
import getApiEndpoint from "utils/serverless-api";

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

  useEffect(() => {
    setDiscordDetailsLoading(true);
    setDiscordDetailsError(false);
    if (isAuthenticated && discordJWT) {
      getApiEndpoint()
        .prelaunch.discordUserDetails(discordJWT)
        .then((data) => {
          setId(data.discordId);
          setName(data.discordName);
          setAvatar(data.discordAvatar);
          setWalletLinked(data.walletLinked);
        })
        .catch(() => {
          setDiscordDetailsError(true);
        })
        .finally(() => {
          setDiscordDetailsLoading(false);
        });
    } else {
      setId(undefined);
      setName(undefined);
      setAvatar(undefined);
      setWalletLinked(undefined);
    }
  }, [discordJWT, isAuthenticated]);

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
