import { useState, useEffect } from "react";
import getPrelaunchRewards from "./api/getPrelaunchRewards";
import { useConnection } from "hooks";
import { RewardsApiInterface } from "utils/serverless-api/types";

export type FlowSelector = "splash" | "traveller" | "info";

export default function usePreLaunchAirdrop() {
  const [activePageFlow, setActivePageFlow] = useState<FlowSelector>("splash");
  const { isConnected, account } = useConnection();
  const [rewardsData, setRewardsData] = useState<RewardsApiInterface>(
    {} as RewardsApiInterface
  );
  useEffect(() => {
    if (isConnected && account) {
      getPrelaunchRewards(account)
        .then((res) => {
          if (res) {
            setRewardsData(res);
          }
        })
        .finally(() => {
          setActivePageFlow("splash");
        });
    }
  }, [isConnected, account]);

  return {
    activePageFlow,
    setActivePageFlow,

    switchToSplash: () => setActivePageFlow("splash"),
    switchToTraveller: () => setActivePageFlow("traveller"),
    switchToInfo: () => setActivePageFlow("info"),
    rewardsData,
    account,
  };
}
