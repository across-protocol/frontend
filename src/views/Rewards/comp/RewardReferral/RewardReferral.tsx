import {
  Wrapper,
  ReferralImageWrapper,
  ReferralImage,
  Header,
  SubHeader,
  CopyRow,
  ReferralUrl,
  CopyButton,
} from "./RewardReferral.styles";
const referralUrl = "www.across.to/ref=acx0x7612B823";

const RewardReferral = () => {
  return (
    <Wrapper>
      <ReferralImageWrapper>
        <ReferralImage />
      </ReferralImageWrapper>
      <Header>Friends refer friends — and earn from it.</Header>
      <SubHeader>
        This feature is still in development, but you can start collecting
        referrals by sharing the link below.
      </SubHeader>
      <CopyRow>
        <ReferralUrl>{referralUrl}</ReferralUrl>
        <CopyButton onClick={() => navigator.clipboard.writeText(referralUrl)}>
          Copy link
        </CopyButton>
      </CopyRow>
    </Wrapper>
  );
};

export default RewardReferral;
