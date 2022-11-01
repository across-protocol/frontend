import { useQuery } from "react-query";

import { airdropWindowIndex } from "utils/constants";
import { fetchIsClaimed } from "utils/merkle-distributor";
import { useConnection } from "hooks";

import { useAirdropRecipient } from "./useAirdropRecipient";

export function useIsClaimed() {
  const { account } = useConnection();
  const airdropRecipientQuery = useAirdropRecipient();

  const isQueryEnabled = Boolean(airdropRecipientQuery.data && account);

  return useQuery(
    ["airdrop", "is-claimed", account, airdropWindowIndex],
    () => {
      if (airdropRecipientQuery.data) {
        return fetchIsClaimed(
          airdropWindowIndex,
          airdropRecipientQuery.data.accountIndex
        );
      }
    },
    {
      enabled: isQueryEnabled,
    }
  );
}
