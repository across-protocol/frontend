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

  useEffect(() => {
    if (discordJWT) {
      getApiEndpoint()
        .prelaunch.discordUserDetails(discordJWT)
        .then((data) => {
          setId(data.discordId);
          setName(data.discordName);
          setAvatar(data.discordAvatar);
          setWalletLinked(data.walletLinked);
        });
    }
  }, [discordJWT]);

  const linkWallet = useCallback(async () => {
    if (signer && discordJWT && id) {
      await getApiEndpoint().prelaunch.connectWallet(discordJWT, id, signer);
      setWalletLinked(await signer.getAddress());
    }
  }, [signer, discordJWT, id]);

  return {
    discordId: id,
    discordName: name,
    discordAvatar: avatar,
    linkWalletHandler: linkWallet,
    walletIsLinked: walletLinked,
  };
}
