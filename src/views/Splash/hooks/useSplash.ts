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
      value: humanReadableNumber(data?.totalDeposits ?? 0),
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
      title: "Top security",
      description:
        "Posuere aliquet faucibus sodales tristique egestas. Egestas quis nibh maecenas mi convallis aliquet. At egestas lectus at vel viverra ipsum convallis mattis eros. Scelerisque interdum elementum proin nibh velit libero lacus in enim.",
    },
    {
      icon: ZapIcon,
      title: "Blazing speed",
      description:
        "Posuere aliquet faucibus sodales tristique egestas. Egestas quis nibh maecenas mi convallis aliquet. At egestas lectus at vel viverra ipsum convallis mattis eros. Scelerisque interdum elementum proin nibh velit libero lacus in enim.",
    },
    {
      icon: PiggyBankIcon,
      title: "The affordable option",
      description:
        "Posuere aliquet faucibus sodales tristique egestas. Egestas quis nibh maecenas mi convallis aliquet. At egestas lectus at vel viverra ipsum convallis mattis eros. Scelerisque interdum elementum proin nibh velit libero lacus in enim.",
    },
    {
      icon: GemIcon,
      title: "Capital efficiency",
      description:
        "Posuere aliquet faucibus sodales tristique egestas. Egestas quis nibh maecenas mi convallis aliquet. At egestas lectus at vel viverra ipsum convallis mattis eros. Scelerisque interdum elementum proin nibh velit libero lacus in enim.",
    },
  ];

  return {
    numericBenefits,
    cardBenefits,
  };
}
