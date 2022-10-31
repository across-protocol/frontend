import { useEffect, useState } from "react";
import { useConnection, useAcrossStakingPool } from "hooks";

import { useAirdropRecipient } from "./useAirdropRecipient";
import { useIsClaimed } from "./useIsClaimed";
import { useClaim } from "./useClaim";

import { getConfig } from "utils/config";
import ACXImageSrc from "assets/acx.svg";
import { formatWeiPct } from "utils";

export type FlowSelector = "splash" | "info" | "eligible" | "ineligible";

export default function useAirdrop() {
  const config = getConfig();
  const [activePageFlow, setActivePageFlow] = useState<FlowSelector>("splash");
  const { isConnected, account, connect, provider } = useConnection();

  const airdropRecipientQuery = useAirdropRecipient();
  const isClaimedQuery = useIsClaimed();
  const claimMutation = useClaim();
  const acrossStakingPoolQuery = useAcrossStakingPool();

  const handleAddTokenToWallet = async () => {
    if (provider) {
      await (provider as any).send("wallet_watchAsset", {
        type: "ERC20",
        options: {
          address: config.getAcrossTokenAddress(),
          symbol: "ACX",
          decimals: 18,
          image: ACXImageSrc, // TODO
        },
      });
    }
  };

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

  const maxApyPct = acrossStakingPoolQuery.data
    ? formatWeiPct(acrossStakingPoolQuery.data.apyData.maxApy, 2)
    : undefined;

  const currentApyPct = acrossStakingPoolQuery.data
    ? formatWeiPct(acrossStakingPoolQuery.data.apyData.totalApy, 2)
    : undefined;

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
    isClaimedQuery,
    claimMutation,

    isConnected,
    account,
    connectWallet: () => connect(),
    handleAddTokenToWallet,
  };
}
