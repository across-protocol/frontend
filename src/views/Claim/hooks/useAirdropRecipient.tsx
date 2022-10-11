import axios from "axios";
import { useQuery } from "react-query";

import { useConnection } from "state/hooks";

type RecipientsWithProof = {
  [address: string]: {
    accountIndex: number;
    amount: string;
    proof: string[];
    metadata: {
      amountBreakdown: {
        liquidity: string;
        bridging: string;
        community: string;
      };
    };
  };
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

  const { data } = await axios.get<RecipientsWithProof>(
    // TODO: replace with IPFS gateway url
    "https://gist.githubusercontent.com/dohaki/53b241c26793260b6423fa1706e4cb96/raw/75bf9bb6e5adae3b059630de1b08b5db6d003959/recipients.json"
  );

  return data[account];
}
