import { useQuery } from "react-query";

import { useConnection } from "hooks";
import { fetchAirdropProof } from "utils/merkle-distributor";

export function useAirdropRecipient() {
  const { isConnected, account } = useConnection();

  return useQuery(["airdrop", account], () => fetchAirdropProof(account), {
    enabled: isConnected && !!account,
  });
}
