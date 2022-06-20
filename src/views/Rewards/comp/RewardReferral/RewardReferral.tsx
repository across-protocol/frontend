import {
  Wrapper,
  ReferralImageWrapper,
  ReferralImage,
  Header,
  SubHeader,
} from "./RewardReferral.styles";
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
    </Wrapper>
  );
};

export default RewardReferral;
