import axios, { AxiosError } from "axios";
import { providers } from "ethers";
import { useDiscord } from "hooks/useDiscord";
import { useOnboard } from "hooks/useOnboard";
import { useCallback, useEffect, useState } from "react";
import { rewardsApiUrl } from "utils";

export function useDiscordDetails() {
  const { discordJWT } = useDiscord();
  const { signer } = useOnboard();

  const [id, setId] = useState<string | undefined>(undefined);
  const [name, setName] = useState<string | undefined>(undefined);
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [walletLinked, setWalletLinked] = useState<boolean | undefined>(
    undefined
  );

  useEffect(() => {
    if (discordJWT) {
      getUserDetails(discordJWT).then((data) => {
        setId(data.id);
        setName(data.name);
        setAvatar(data.avatar);
        setWalletLinked(data.walletLinked);
      });
    }
  }, [discordJWT]);

  const linkWallet = useCallback(async () => {
    if (signer && discordJWT && id) {
      await signUserWallet(discordJWT, id, signer);
      setWalletLinked(true);
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

async function getUserDetails(discordJWT: string) {
  // Call to scraper API and resolve the JWT
  const jwtResolver = await axios.get<{
    user: {
      discordId: string;
      discordName: string;
      discordAvatar: string;
    };
  }>(`${rewardsApiUrl}/users/me`, {
    headers: {
      Authorization: `Bearer ${discordJWT}`,
    },
  });
  const walletLinked = await doesWalletExist(discordJWT);
  return {
    id: jwtResolver.data.user.discordId,
    name: jwtResolver.data.user.discordName,
    avatar: jwtResolver.data.user.discordAvatar,
    walletLinked,
  };
}

async function doesWalletExist(discordJWT: string) {
  try {
    // Resolve whether the user has a wallet
    await axios.get(`${rewardsApiUrl}/users/me/wallets`, {
      headers: {
        Authorization: `Bearer ${discordJWT}`,
      },
    });
    return true;
  } catch (e) {
    if (e instanceof AxiosError) {
      if (e.response?.data.error === "WalletNotFoundException") {
        return false;
      } else {
        throw e;
      }
    }
    return false;
  }
}

async function signUserWallet(
  discordJWT: string,
  discordId: string,
  signer: providers.JsonRpcSigner
) {
  // Resolve wallet address of signer
  const address = await signer.getAddress();
  // Sign the discord ID with a wallet
  const signed = await signer.signMessage(discordId);
  // Check if wallets exist
  const alreadyLinked = await doesWalletExist(discordJWT);
  // Set wallet address
  await axios({
    url: `${rewardsApiUrl}/users/me/wallets`,
    method: alreadyLinked ? "patch" : "post",
    headers: {
      Authorization: `Bearer ${discordJWT}`,
    },
    data: {
      signature: signed,
      walletAddress: address,
      discordId: discordId,
    },
  });
}
