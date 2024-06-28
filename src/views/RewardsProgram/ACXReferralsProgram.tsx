import styled from "@emotion/styled";
import { ReactComponent as ReferralSVG } from "assets/icons/referral-within-star.svg";
import { COLORS, QUERIESV2 } from "utils";
import ACXReferralLinkCard from "./ACXReferralsProgram/ACXReferralLinkCard";
import ACXReferralTierStepper from "./ACXReferralsProgram/ACXReferralTierStepper";
import GenericRewardsProgram from "./GenericRewardsProgram/GenericRewardsProgram";
import { useACXReferralsProgram } from "./hooks/useACXReferralsProgram";
import { Alert, Text } from "components";

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
      Banner={
        <Alert status="warn" alignIcon="center">
          <AlertContent>
            <Text color="warning">
              The referral rewards program is being discontinued. Earning was
              disabled on May 15th and you must claim all rewards by June 30th.
            </Text>
            <LearnMoreLink
              href="https://snapshot.org/#/acrossprotocol.eth/proposal/0xa8af5c0d2a9caea7057900744cfde4ee28529300f947abf7696856216a97f8eb"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Text color="white">Learn more</Text>
            </LearnMoreLink>
          </AlertContent>
        </Alert>
      }
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

const AlertContent = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const LearnMoreLink = styled.a`
  display: flex;
  height: 40px;
  padding: 0px 20px;
  justify-content: center;
  align-items: center;
  gap: 6px;

  border-radius: 8px;
  border: 1px solid var(--Color-Interface-yellow-15, rgba(249, 210, 108, 0.15));
  background: var(--Color-Interface-yellow-5, rgba(249, 210, 108, 0.05));

  cursor: pointer;

  &:hover {
    opacity: 0.75;
  }
`;
