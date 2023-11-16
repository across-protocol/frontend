import GenericRewardsProgram from "./GenericRewardsProgram";
import { useACXReferralsProgram } from "./hooks/useACXReferralsProgram";
import ACXReferralLinkCard from "./ACXReferralLinkCard";
import { COLORS } from "utils";
import styled from "@emotion/styled";
import ACXReferralTierStepper from "./ACXReferralTierStepper";

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
      transferFilter={() => true}
    />
  );
};

export default ACXReferralsProgram;

const Divider = styled.div`
  height: 1px;
  margin-left: -100%;
  width: 300%;
  flex-shrink: 0;
  background-color: ${COLORS["grey-400-15"]};
`;
