import { ReactComponent as UsersIcon } from "assets/multi-users.svg";
import { ReactComponent as GemIcon } from "assets/gem.svg";
import { ReactComponent as ZapIcon } from "assets/zap.svg";
import { ReactComponent as ShieldIcon } from "assets/shield-check.svg";
import { useSplashDynamicData } from "./useSplashDynamicData";
import { repeatableTernaryBuilder } from "utils/ternary";
import { humanReadableNumber } from "utils";
import { useLocation } from "react-router-dom";

export function useSplash() {
  const data = useSplashDynamicData();
  const ternary = repeatableTernaryBuilder(Boolean(data), "-");
  const location = useLocation();

  const numericBenefits = [
    {
      title: "Total Volume",
      value: ternary(`$${humanReadableNumber(data?.totalVolumeUsd ?? 0, 1)}`),
    },
    {
      title: "Total Transactions",
      value: ternary(humanReadableNumber(data?.totalDeposits ?? 0)),
    },
    {
      title: "Average Fill Time",
      value: ternary(`${Math.floor(data?.avgFillTimeInMinutes ?? 0)} min`),
    },
    { title: "To Bridge 1 ETH", value: ternary("< $1") },
  ];

  const cardBenefits = [
    {
      icon: ShieldIcon,
      title: "Safe",
      description:
        "The optimistic design means that no matter how many people are participating in the bridge, it only takes one single honest actor to dispute a false claim.",
    },
    {
      icon: ZapIcon,
      title: "Fast",
      description: `Across is able to offer extremely fast bridging. Today, that means bridging under ${Math.floor(
        data?.avgFillTimeInMinutes ?? 0
      )} minutes on average. In the future, next-block bridging will be possible.`,
    },
    {
      icon: UsersIcon,
      title: "Growing",
      description:
        "There are many ways to become a part of this mission, earn ACX rewards, and help guide the direction of the Across DAO. The place to start is in the community.",
    },
    {
      icon: GemIcon,
      title: "Capital Efficient",
      description:
        "Higher capital efficiency means lower costs and fewer funds at risk. Across was built with the thesis that capital efficiency is the single most important measure of a cross-chain bridge.",
    },
  ];

  return {
    numericBenefits,
    cardBenefits,
    location,
  };
}
