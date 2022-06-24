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
} from "./RewardReferral.styles";

const referralUrl = "www.across.to/referrer=acx0x7612B823....";
const referralText = "Across blurb www.across.to/referrer=acx0x7612B823....";
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
            <ReferralUrl>{referralUrl}</ReferralUrl>
          </CopyRow>
        </ReferralLinkBlock>
        <ReferralTierBlock></ReferralTierBlock>
      </ReferralRow>
    </Wrapper>
  );
};

export default RewardReferral;
