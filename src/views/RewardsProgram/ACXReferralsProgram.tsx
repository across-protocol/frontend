import styled from "@emotion/styled";
import { ReactComponent as ReferralSVG } from "assets/icons/rewards/referral-within-star.svg";
import { COLORS } from "utils";
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
  margin-left: -100%;
  width: 300%;
  flex-shrink: 0;
  background-color: ${COLORS["aqua-5"]};
`;

export const StyledReferralLogo = styled(ReferralSVG)`
  margin: 0 auto;
  height: 64px;
  width: 64px;
`;
