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
} from "./RewardReferral.styles";

const referralUrl = "www.across.to/referrer=acx0x7612B823....";
const referralText = "Across blurb www.across.to/referrer=acx0x7612B823....";
const RewardReferral = () => {
  return (
    <Wrapper>
      <ReferralRow>
        <ReferralLinkBlock>
          <StyledTwitterLogo />
          <Header>My referral link</Header>
          <SubHeader>
            Share your unique referral link and collect ACX rewards for every
            transfer made from your referral.
          </SubHeader>
        </ReferralLinkBlock>
        <ReferralTierBlock></ReferralTierBlock>
      </ReferralRow>
    </Wrapper>
  );
};

export default RewardReferral;
