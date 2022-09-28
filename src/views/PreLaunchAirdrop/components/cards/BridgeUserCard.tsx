import AirdropCard from "../AirdropCard";
import RewardsCard from "./RewardsCard";
import { RewardsApiInterface } from "utils/serverless-api/types";

import { ReactComponent as BridgeIcon } from "assets/icons/plaap/bridge.svg";
import { ReactComponent as WalletIcon } from "assets/icons/wallet-icon.svg";
import { CheckIconState } from "../CardIcon";

interface Props {
  rewardsData: RewardsApiInterface;
  account?: string;
}

function useBridgeUserCard(rewardsData: RewardsApiInterface) {
  const check: CheckIconState = rewardsData?.earlyUserRewards?.eligible
    ? "eligible"
    : "ineligible";
  return { check };
}

const BridgeUserCard: React.FC<Props> = ({ rewardsData, account }) => {
  const { check } = useBridgeUserCard(rewardsData);
  return (
    <AirdropCard
      title="Early Bridge User"
      description="Users who bridge assets on Across before the Across Referral Program launch (July 18th, 2022) may be eligible for the $ACX airdrop."
      Icon={BridgeIcon}
      check={check}
      rewardAmount={rewardsData?.earlyUserRewards?.payout}
      children={
        check === "eligible" && (
          <RewardsCard
            label="Eligible wallet"
            address={account ?? ""}
            Icon={<WalletIcon />}
            bottomText="Rewards are estimated as of September 1, 2022 and are subject to
    change."
          />
        )
      }
    />
  );
};

export default BridgeUserCard;
