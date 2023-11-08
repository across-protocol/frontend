import { BigNumber } from "ethers";
import { useRewards } from "../hooks/useRewards";
import GenericOverviewCard from "./GenericOverviewCard";
import { ReactComponent as Icon } from "assets/icons/rewards/graph-within-star.svg";
import { formatUSD } from "utils";

const OverviewStakingCard = () => {
  const { stakedTokens, largestStakedPool } = useRewards();
  const formatUsd = (value: BigNumber) => `$${formatUSD(value)}`;
  return (
    <GenericOverviewCard
      upperCard={{
        title: formatUsd(stakedTokens),
        subTitle: "$ in staked LP tokens",
      }}
      lowerCard={{
        left: {
          title: largestStakedPool?.name ?? "NONE",
          subTitle: "Top Pool",
        },
        right: {
          title: formatUsd(largestStakedPool?.amount ?? BigNumber.from(0)),
          subTitle: "Staked amount",
        },
      }}
      Icon={Icon}
    />
  );
};

export default OverviewStakingCard;
