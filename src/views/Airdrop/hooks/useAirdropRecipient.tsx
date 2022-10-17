import axios, { AxiosError } from "axios";
import { useQuery } from "react-query";

import { useConnection } from "hooks";

type ClaimWithProof = {
  windowIndex: number;
  accountIndex: number;
  amount: string;
  proof: string[];
  metadata: {
    amountBreakdown: {
      communityRewards: string;
      liquidityProviderRewards: string;
      earlyUserRewards: string;
      welcomeTravelerRewards: string;
    };
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
      "https://gist.githubusercontent.com/dohaki/53b241c26793260b6423fa1706e4cb96/raw/fea03c3ceac49bfb8fa952d19a3342a94665df06/recipients.json"
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
