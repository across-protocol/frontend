import { ReactComponent as GemIcon } from "assets/gem.svg";
import { ReactComponent as PiggyBankIcon } from "assets/piggy-bank.svg";
import { ReactComponent as ZapIcon } from "assets/zap.svg";
import { ReactComponent as ShieldIcon } from "assets/shield-check.svg";
import { useSplashDynamicData } from "./useSplashDynamicData";
import { repeatableTernaryBuilder } from "utils/ternary";
import { humanReadableNumber } from "utils";

export function useSplash() {
  const data = useSplashDynamicData();
  const ternary = repeatableTernaryBuilder(Boolean(data), "-");

  const numericBenefits = [
    {
      title: "Total Volume",
      value: ternary(`$${humanReadableNumber(data?.totalVolumeUsd ?? 0)}`),
    },
    {
      title: "Total Transactions",
      value: ternary(humanReadableNumber(data?.totalDeposits ?? 0)),
    },
    {
      title: "Average Fill Time",
      value: ternary(`${Math.floor(data?.avgFillTimeInMinutes ?? 0)} min`),
    },
    { title: "User Funds Lost", value: ternary("$0") },
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
      description:
        "Across is able to offer extremely fast bridging. Today, that means bridging under 3 minutes. In the future, next-block bridging will be possible.",
    },
    {
      icon: PiggyBankIcon,
      title: "Growing",
      description:
        "There are many ways to become a part of this mission, earn ACX rewards, and help guide the direction of the Across DAO. The best way is to start in the community.",
    },
    {
      icon: GemIcon,
      title: "Elegant",
      description:
        "Across is the result of approaching bridging not only as a technical concern but also as a financial engineering one. Across champions capital efficiency in every design choice.",
    },
  ];

  return {
    numericBenefits,
    cardBenefits,
  };
}
