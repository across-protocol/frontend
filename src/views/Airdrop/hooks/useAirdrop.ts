import { useEffect, useState } from "react";
import { useConnection, useAcrossStakingPool } from "hooks";

import { useAirdropRecipient } from "./useAirdropRecipient";
import { useIsAirdropClaimed } from "./useIsAirdropClaimed";
import { useClaimAndStake } from "./useClaimAndStake";

import { formatWeiPct } from "utils";

export type FlowSelector = "splash" | "info" | "eligible" | "ineligible";

export default function useAirdrop() {
  const [activePageFlow, setActivePageFlow] = useState<FlowSelector>("splash");
  const { isConnected, account, connect } = useConnection();

  const airdropRecipientQuery = useAirdropRecipient();
  const isAirdropClaimedQuery = useIsAirdropClaimed();
  const claimAndStakeMutation = useClaimAndStake();
  const acrossStakingPoolQuery = useAcrossStakingPool();

  useEffect(() => {
    if (isConnected && account && !airdropRecipientQuery.isLoading) {
      setActivePageFlow(airdropRecipientQuery.data ? "eligible" : "ineligible");
    } else {
      setActivePageFlow("splash");
    }
  }, [
    airdropRecipientQuery.data,
    airdropRecipientQuery.isLoading,
    isConnected,
    account,
  ]);

  const maxApyPct = formatWeiPct(
    acrossStakingPoolQuery.data?.apyData.maxApy,
    2
  );

  const currentApyPct = formatWeiPct(
    acrossStakingPoolQuery.data?.apyData.totalApy,
    2
  );

  return {
    activePageFlow,
    switchToInfo: () => setActivePageFlow("info"),
    switchToSplash: () => setActivePageFlow("splash"),
    switchToEligible: () => setActivePageFlow("eligible"),
    switchToIneligible: () => setActivePageFlow("ineligible"),

    maxApyPct,
    currentApyPct,
    acrossStakingPoolQuery,
    airdropRecipientQuery,
    isAirdropClaimedQuery,
    claimAndStakeMutation,

    isConnected,
    account,
    connectWallet: () => connect(),
  };
}
