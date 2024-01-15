import { useQuery } from "react-query";

import { isAirdropClaimedQueryKey } from "utils";
import { airdropWindowIndex } from "utils/constants";
import { fetchIsClaimed } from "utils/merkle-distributor";
import { useConnection } from "hooks";

import { useAirdropRecipient } from "./useAirdropRecipient";

export function useIsAirdropClaimed() {
  const { account } = useConnection();
  const airdropRecipientQuery = useAirdropRecipient();

  const isQueryEnabled = Boolean(airdropRecipientQuery.data && account);

  return useQuery(
    isAirdropClaimedQueryKey(account, airdropWindowIndex),
    () => {
      if (airdropRecipientQuery.data) {
        return fetchIsClaimed(
          airdropWindowIndex,
          airdropRecipientQuery.data.accountIndex,
          "referrals"
        );
      }
    },
    {
      enabled: isQueryEnabled,
    }
  );
}
