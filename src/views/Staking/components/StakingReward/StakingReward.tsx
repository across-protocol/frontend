import {
  InfoText,
  InfoTextWrapper,
  InfoIcon,
  Title,
  Wrapper,
  InnerWrapper,
  Divider,
  AlertInfoWrapper,
} from "./StakingReward.styles";

export const StakingReward = () => {
  return (
    <Wrapper>
      <InnerWrapper>
        <Title>Rewards</Title>
      </InnerWrapper>
      <InnerWrapper>
        <InfoTextWrapper>
          <InfoIcon />
          <InfoText>
            Claiming tokens will reset your multiplier and decrease your ACX APY
          </InfoText>
        </InfoTextWrapper>
        <AlertInfoWrapper>
          <InfoIcon />
          <InfoText>The amount entered exceeds your claimable amount</InfoText>
        </AlertInfoWrapper>
      </InnerWrapper>
      <InnerWrapper>
        <Divider />
      </InnerWrapper>
      <InnerWrapper></InnerWrapper>
    </Wrapper>
  );
};

export default StakingReward;
