import { useClaimAndStake } from "hooks/useClaimAndStake";

import { useAirdropRecipient } from "./useAirdropRecipient";
import { useIsClaimed } from "./useIsClaimed";

export function useClaim() {
  const airdropRecipientQuery = useAirdropRecipient();
  const isClaimedQuery = useIsClaimed();

  return useClaimAndStake(
    airdropRecipientQuery.data ? [airdropRecipientQuery.data] : [],
    () => isClaimedQuery.refetch()
  );
}
