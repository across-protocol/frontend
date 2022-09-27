import { useDiscord } from "hooks/useDiscord";
import { useOnboard } from "hooks/useOnboard";
import { useCallback, useEffect, useState } from "react";
import getApiEndpoint from "utils/serverless-api";

export function useDiscordDetails() {
  const { discordJWT } = useDiscord();
  const { signer } = useOnboard();

  const [id, setId] = useState<string | undefined>(undefined);
  const [name, setName] = useState<string | undefined>(undefined);
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [walletLinked, setWalletLinked] = useState<string | undefined>(
    undefined
  );
  const [discordDetailsLoading, setDiscordDetailsLoading] = useState(false);
  const [discordDetailsError, setDiscordDetailsError] = useState(false);
  const [walletLinkingError, setWalletLinkingError] = useState(false);

  useEffect(() => {
    setDiscordDetailsLoading(true);
    setDiscordDetailsError(false);
    if (discordJWT) {
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
    }
  }, [discordJWT]);

  const linkWallet = useCallback(async () => {
    if (signer && discordJWT && id) {
      setDiscordDetailsLoading(true);
      try {
        await getApiEndpoint().prelaunch.connectWallet(discordJWT, id, signer);
        setWalletLinked(await signer.getAddress());
        setWalletLinkingError(false);
      } catch (_e) {
        setWalletLinkingError(true);
      } finally {
        setDiscordDetailsLoading(false);
      }
    }
  }, [signer, discordJWT, id]);

  return {
    discordId: id,
    discordName: name,
    discordAvatar: avatar,
    linkWalletHandler: linkWallet,
    linkedWallet: walletLinked,
    discordDetailsLoading,
    discordDetailsError,
    walletLinkingError,
  };
}
