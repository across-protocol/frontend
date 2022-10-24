import { useQuery } from "react-query";

import { getConfig } from "utils/config";
import { airdropWindowIndex } from "utils/constants";
import { useConnection } from "hooks";

import { useAirdropRecipient } from "./useAirdropRecipient";

const config = getConfig();

export function useIsClaimed() {
  const { account } = useConnection();
  const airdropRecipientQuery = useAirdropRecipient();

  const isQueryEnabled = Boolean(
    airdropRecipientQuery.data?.accountIndex && account
  );

  return useQuery(
    ["airdrop", "is-claimed", account, airdropWindowIndex],
    () => {
      if (airdropRecipientQuery.data?.accountIndex) {
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

async function fetchIsClaimed(windowIndex: number, accountIndex: number) {
  const merkleDistributor = config.getMerkleDistributor();
  return merkleDistributor.isClaimed(windowIndex, accountIndex);
}
