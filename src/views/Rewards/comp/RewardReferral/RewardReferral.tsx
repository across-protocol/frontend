import { Stepper } from "components";
import {
  Wrapper,
  // ReferralImageWrapper,
  // ReferralImage,
  // ShareTwitterText,
  // TwitterRow,
  Header,
  SubHeader,
  CopyRow,
  ReferralUrl,
  CopyButton,
  StyledTwitterLogo,
  ReferralRow,
  ReferralLinkBlock,
  ReferralTierBlock,
  IconWrapper,
  TierSmHeader,
  TierHeader,
  TierInfo,
  TierInfoItem,
  LightGrayItemText,
  GreenItemText,
  WarningInfoItem,
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
              <span>{referralUrl}</span>{" "}
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
          <TierHeader>Bronze</TierHeader>
          <Stepper currentStep={2} numSteps={5} />
          <TierInfo>
            <TierInfoItem>Referee wallets</TierInfoItem>
            <TierInfoItem>3</TierInfoItem>
            <TierInfoItem>Transfers</TierInfoItem>
            <TierInfoItem>
              5 Transfers <LightGrayItemText>5 to next tier </LightGrayItemText>
            </TierInfoItem>
            <TierInfoItem>Volume transfers</TierInfoItem>
            <TierInfoItem>
              $54,321.24{" "}
              <LightGrayItemText>$25,000.00 to next tier</LightGrayItemText>
            </TierInfoItem>
            <TierInfoItem>Tier bonus</TierInfoItem>
            <TierInfoItem>
              <GreenItemText>50% referral fee</GreenItemText>
            </TierInfoItem>
            <TierInfoItem>Rewards from transfers</TierInfoItem>
            <WarningInfoItem>Not claimable yet ~2210.012 ACX</WarningInfoItem>
          </TierInfo>
        </ReferralTierBlock>
      </ReferralRow>
    </Wrapper>
  );
};

export default RewardReferral;
