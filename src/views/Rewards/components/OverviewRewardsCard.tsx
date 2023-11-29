import { BigNumber } from "ethers";
import { useRewards } from "../hooks/useRewards";
import GenericOverviewCard from "./GenericOverviewCard";
import { ReactComponent as Icon } from "assets/icons/reward-lg.svg";
import { useConnection } from "hooks";

const OverviewRewardsCard = () => {
  const { totalRewards, referralACXRewards, stakingRewards, formatterFn } =
    useRewards();
  const { isConnected } = useConnection();
  const formatACX = (value: BigNumber) => `${formatterFn(value)} ACX`;
  return (
    <GenericOverviewCard
      upperCard={{
        title: isConnected ? formatACX(totalRewards) : "-",
        subTitle: "ACX Rewards",
      }}
      lowerCard={{
        left: {
          title: referralACXRewards.gt(0) ? formatACX(referralACXRewards) : "-",
          subTitle: "Referral rewards",
        },
        right: {
          title: stakingRewards.gt(0) ? formatACX(stakingRewards) : "-",
          subTitle: "Staking rewards",
        },
      }}
      Icon={<Icon />}
    />
  );
};

export default OverviewRewardsCard;
