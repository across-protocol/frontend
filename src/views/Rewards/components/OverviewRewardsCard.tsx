import { BigNumber } from "ethers";
import { useRewards } from "../hooks/useRewards";
import GenericOverviewCard from "./GenericOverviewCard";
import { ReactComponent as Icon } from "assets/icons/rewards/graph-within-star.svg";

const OverviewRewardsCard = () => {
  const { totalRewards, referralACXRewards, stakingRewards, formatterFn } =
    useRewards();
  const formatACX = (value: BigNumber) => `${formatterFn(value)} ACX`;
  return (
    <GenericOverviewCard
      upperCard={{
        title: formatACX(totalRewards),
        subTitle: "ACX Rewards",
      }}
      lowerCard={{
        left: {
          title: formatACX(referralACXRewards),
          subTitle: "Referral rewards",
        },
        right: {
          title: formatACX(stakingRewards),
          subTitle: "Staking rewards",
        },
      }}
      Icon={Icon}
    />
  );
};

export default OverviewRewardsCard;
