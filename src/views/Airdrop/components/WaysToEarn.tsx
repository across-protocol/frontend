import styled from "@emotion/styled";

import { ReactComponent as PoolStarRingIcon } from "assets/pool-star-ring.svg";
import { ReactComponent as ReferralIcon } from "assets/referral-star-ring.svg";

import { EarnOptionCard } from "./EarnOptionCard";

const OPTIONS = [
  {
    MainIcon: <ReferralIcon />,
    title: "Across Referral Program",
    subTitle:
      "Join the referral program and earn a portion of fees in ACX for transfers made from your unique referral link.",
    buttonLabel: "Refer to Earn ACX",
    href: "/",
    apyRange: [5, 6],
  },
  {
    MainIcon: <PoolStarRingIcon />,
    title: "Pool and Stake LP Tokens",
    subTitle:
      "Provide liquidity on Across and stake your LP tokens to earn ACX tokens in proportion to your staking.",
    buttonLabel: "Pool and Stake to Earn ACX",
    href: "/rewards/staking",
    apyRange: [5, 6],
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
