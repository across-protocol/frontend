import axios, { AxiosError } from "axios";
import { useQuery } from "react-query";

import { useConnection } from "hooks";

export type AmountBreakdown = {
  communityRewards: string;
  liquidityProviderRewards: string;
  earlyUserRewards: string;
  welcomeTravelerRewards: string;
};

export type ClaimWithProof = {
  windowIndex: number;
  accountIndex: number;
  amount: string;
  proof: string[];
  metadata: {
    amountBreakdown: AmountBreakdown;
  };
};

type AirdropRecipient = {
  user: {
    discordName: string;
    discordAvatar: string;
  };
  claims: ClaimWithProof[];
};

export function useAirdropRecipient() {
  const { isConnected, account } = useConnection();

  return useQuery(["airdrop", account], () => getAirdropRecipient(account), {
    enabled: isConnected && !!account,
  });
}

async function getAirdropRecipient(account?: string) {
  if (!account) {
    return undefined;
  }

  try {
    const { data } = await axios.get<AirdropRecipient>(
      // TODO: replace with Scraper API
      "https://gist.githubusercontent.com/dohaki/53b241c26793260b6423fa1706e4cb96/raw/238982c067e36c68f854f6887cb0fa433fbbb406/recipients.json"
    );

    return data;
  } catch (error: unknown) {
    // if scraper api returns 404 then account not eligible
    if (error instanceof AxiosError && error.response?.status === 404) {
      return undefined;
    }

    throw error;
  }
}
