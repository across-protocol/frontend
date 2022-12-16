import { useEffect, useState } from "react";
import {
  useConnection,
  useAcrossStakingPool,
  useMaxApyOfAllStakingPools,
} from "hooks";

import { useAirdropRecipient } from "./useAirdropRecipient";
import { useIsAirdropClaimed } from "./useIsAirdropClaimed";
import { useClaimAndStake } from "./useClaimAndStake";

import { formatWeiPct, trackConnectWalletButtonClicked } from "utils";

export type FlowSelector = "splash" | "info" | "eligible" | "ineligible";

export default function useAirdrop() {
  const [activePageFlow, setActivePageFlow] = useState<FlowSelector>("splash");
  const [refreshPage, setRefreshPage] = useState(0);
  const { isConnected, account, connect } = useConnection();

  const airdropRecipientQuery = useAirdropRecipient();
  const isAirdropClaimedQuery = useIsAirdropClaimed();
  const claimAndStakeMutation = useClaimAndStake();
  const acrossStakingPoolQuery = useAcrossStakingPool();
  const { maxApyOfAllStakingPools } = useMaxApyOfAllStakingPools();

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
    refreshPage,
  ]);

  const maxApyPct = formatWeiPct(maxApyOfAllStakingPools, 0);

  const currentApyPct = formatWeiPct(
    acrossStakingPoolQuery.data?.apyData.totalApy,
    0
  );

  return {
    activePageFlow,
    switchToInfo: () => setActivePageFlow("info"),
    switchToSplash: () => setActivePageFlow("splash"),
    switchToEligible: () => setActivePageFlow("eligible"),
    switchToIneligible: () => setActivePageFlow("ineligible"),
    refreshPage: () => setRefreshPage((prev) => prev + 1),

    maxApyPct,
    currentApyPct,
    acrossStakingPoolQuery,
    airdropRecipientQuery,
    isAirdropClaimedQuery,
    claimAndStakeMutation,

    isConnected,
    account,
    connectWallet: () => {
      connect();
      trackConnectWalletButtonClicked("airdropSplashFlow");
    },
  };
}
