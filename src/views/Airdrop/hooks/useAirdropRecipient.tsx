import axios from "axios";
import { useQuery } from "react-query";

import { useConnection } from "hooks";
import { airdropWindowIndex, rewardsApiUrl } from "utils/constants";

export type AmountBreakdown = {
  communityRewards: string;
  liquidityProviderRewards: string;
  earlyUserRewards: string;
  welcomeTravelerRewards: string;
};

type AirdropRecipient = {
  accountIndex: number;
  amount: string;
  payload: {
    amountBreakdown: AmountBreakdown;
  };
  proof: string[];
  merkleRoot: string;
  windowIndex: number;
  ipfsHash: string;
  discord: null | Partial<{
    discordId: string;
    discordName: string;
    discordAvatar: string;
  }>;
};

export function useAirdropRecipient() {
  const { isConnected, account } = useConnection();

  return useQuery(
    ["airdrop", account],
    () => getAirdropRecipient(airdropWindowIndex, account),
    {
      enabled: isConnected && !!account,
    }
  );
}

async function getAirdropRecipient(windowIndex: number, account?: string) {
  if (!account) {
    return undefined;
  }

  const { data } = await axios.get<AirdropRecipient | {}>(
    `${rewardsApiUrl}/airdrop/merkle-distributor-proof?address=${account}&windowIndex=${windowIndex}&includeDiscord=true`
  );
  return Object.keys(data).length ? (data as AirdropRecipient) : undefined;
}
