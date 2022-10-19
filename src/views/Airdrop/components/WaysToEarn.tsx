import styled from "@emotion/styled";

import { ReactComponent as PoolStarRingIcon } from "assets/pool-star-ring.svg";
import { ReactComponent as ReferralIcon } from "assets/referral-star-ring.svg";

import { EarnOptionCard } from "./EarnOptionCard";

const OPTIONS = [
  {
    Icon: <ReferralIcon />,
    title: "Across Referral Program",
    subTitle:
      "Join the referral program and earn a portion of fees in ACX for transfers made from your unique referral link.",
    buttonLabel: "Refer to Earn ACX",
    href: "/",
    pctRange: [40, 80],
    pctLabel: "Referral rate",
    pctTooltip: {
      // TODO: use proper text
      title: "Referral rate",
      body: "Referral rate description",
    },
  },
  {
    Icon: <PoolStarRingIcon />,
    title: "Pool and Stake LP Tokens",
    subTitle:
      "Provide liquidity on Across and stake your LP tokens to earn ACX tokens in proportion to your staking.",
    buttonLabel: "Pool and Stake to Earn ACX",
    href: "/rewards/staking",
    pctRange: [5, 6], // TODO: retrieve dynamically
    pctLabel: "APY",
    pctTooltip: {
      // TODO: use proper text
      title: "APY range",
      body: "APY range description",
    },
  },
];

export function WaysToEarn() {
  return (
    <OptionsContainer>
      {OPTIONS.map((option) => (
        <EarnOptionCard key={option.title} {...option} />
      ))}
    </OptionsContainer>
  );
}

const OptionsContainer = styled.div`
  gap: 16px;
  display: flex;
  flex-direction: column;
`;
