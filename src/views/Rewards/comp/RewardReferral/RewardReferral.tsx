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
} from "./RewardReferral.styles";
import Footer from "components/Footer";

const referralUrl = "www.across.to/ref=acx0x7612B823";
const referralText = "Across blurb www.across.to/ref=acx0x7612B823";
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
      <TwitterRow>
        <StyledTwitterLogo />
        <ShareTwitterText
          href={`https://twitter.com/intent/tweet?button_hashtag=${referralText}&ref_src=twsrc%5Etfw`}
          data-show-count="false"
        >
          Share on Twitter
        </ShareTwitterText>
      </TwitterRow>
      <Footer />
    </Wrapper>
  );
};

export default RewardReferral;
