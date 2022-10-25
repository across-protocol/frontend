import { ReactComponent as GemIcon } from "assets/gem.svg";
import { ReactComponent as PiggyBankIcon } from "assets/piggy-bank.svg";
import { ReactComponent as ZapIcon } from "assets/zap.svg";
import { ReactComponent as ShieldIcon } from "assets/shield-check.svg";

export function useSplash() {
  const numericBenefits = [
    { title: "Total Volume", value: "$1.2T" },
    { title: "Total Transactions", value: "115M+" },
    { title: "Average Fill Time", value: "12 min" },
    { title: "User Funds Lost", value: "$0" },
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
