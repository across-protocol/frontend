import styled from "@emotion/styled";
import { ReactComponent as ReferralSVG } from "assets/icons/rewards/referral-within-star.svg";
import { COLORS, QUERIESV2 } from "utils";
import ACXReferralLinkCard from "./ACXReferralsProgram/ACXReferralLinkCard";
import ACXReferralTierStepper from "./ACXReferralsProgram/ACXReferralTierStepper";
import GenericRewardsProgram from "./GenericRewardsProgram/GenericRewardsProgram";
import { useACXReferralsProgram } from "./hooks/useACXReferralsProgram";

const ACXReferralsProgram = () => {
  const { labels, rewardsAmount, claimableAmount } = useACXReferralsProgram();
  return (
    <GenericRewardsProgram
      program="referrals"
      metaCard={labels}
      claimCard={{
        totalRewards: rewardsAmount,
        availableRewards: claimableAmount,
        children: (
          <>
            <ACXReferralLinkCard condensed />
            <Divider />
            <ACXReferralTierStepper />
          </>
        ),
      }}
      programName="ACX Referral Program"
    />
  );
};

export default ACXReferralsProgram;

const Divider = styled.div`
  height: 1px;
  width: calc(100% + 48px);
  flex-shrink: 0;
  background-color: ${COLORS["aqua-5"]};

  @media ${QUERIESV2.sm.andDown} {
    width: calc(100% + 32px);
  }
`;

export const StyledReferralLogo = styled(ReferralSVG)`
  margin: 0 auto;
  height: 64px;
  width: 64px;
`;
