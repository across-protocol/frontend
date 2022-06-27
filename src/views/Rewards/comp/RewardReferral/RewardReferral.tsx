import { Stepper } from "components";
import {
  Wrapper,
  ReferralImageWrapper,
  ReferralImage,
  Header,
  SubHeader,
  CopyRow,
  ReferralUrl,
  CopyButton,
  TwitterRow,
  StyledTwitterLogo,
  ShareTwitterText,
  ReferralRow,
  ReferralLinkBlock,
  ReferralTierBlock,
  IconWrapper,
  TierSmHeader,
  TierHeader,
} from "./RewardReferral.styles";

const referralUrl = "across.to/referrer=0xa1..a234";
const referralText = "Across blurb www.across.to/referrer=0x....";
const RewardReferral = () => {
  return (
    <Wrapper>
      <ReferralRow>
        <ReferralLinkBlock>
          <IconWrapper>
            <StyledTwitterLogo />
          </IconWrapper>
          <Header>My referral link</Header>
          <SubHeader>
            Share your unique referral link and collect ACX rewards for every
            transfer made from your referral.
          </SubHeader>
          <CopyRow>
            <ReferralUrl>
              {referralUrl}{" "}
              <CopyButton
                onClick={() => {
                  navigator.clipboard.writeText(referralText);
                }}
              >
                Copy
              </CopyButton>
            </ReferralUrl>
          </CopyRow>
        </ReferralLinkBlock>
        <ReferralTierBlock>
          <TierSmHeader>Current referral tier</TierSmHeader>
          <TierHeader>Platinum</TierHeader>
          <Stepper numSteps={5} />
        </ReferralTierBlock>
      </ReferralRow>
    </Wrapper>
  );
};

export default RewardReferral;
