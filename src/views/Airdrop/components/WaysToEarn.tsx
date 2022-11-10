import styled from "@emotion/styled";

import { ReactComponent as PoolStarRingIcon } from "assets/pool-star-ring.svg";
import { ReactComponent as ReferralIcon } from "assets/referral-star-ring.svg";

import { tiers } from "../../Referrals/comp/RewardReferral/RewardReferral";
import { EarnOptionCard } from "./EarnOptionCard";

export type Props = {
  maxApyPct?: string;
};

export function WaysToEarn({ maxApyPct }: Props) {
  return (
    <OptionsContainer>
      <EarnOptionCard
        Icon={<PoolStarRingIcon />}
        title="Pool and Stake LP Tokens"
        subTitle="Provide liquidity on Across and stake your LP tokens to earn ACX tokens in proportion to your staking."
        buttonLabel="Pool and Stake to Earn ACX"
        href="/rewards#my-pools"
        bottomText={`Earn up to ${maxApyPct ?? "-"}% APY.`}
      />
      <EarnOptionCard
        Icon={<ReferralIcon />}
        title="Across Referral Program"
        subTitle="Join the referral program and earn a portion of fees in ACX for transfers made from your unique referral link."
        buttonLabel="Refer to Earn ACX"
        href="/rewards/referrals"
        bottomText={`Earn up to ${
          tiers["5"].referralRate * 100
        }% of fees back in ACX.`}
      />
    </OptionsContainer>
  );
}

const OptionsContainer = styled.div`
  gap: 16px;
  display: flex;
  flex-direction: column;
`;
