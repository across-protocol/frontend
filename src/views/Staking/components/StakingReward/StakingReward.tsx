import { formatNumberMaxFracDigits } from "utils";
import {
  InfoText,
  InfoTextWrapper,
  InfoIcon,
  Title,
  Wrapper,
  InnerWrapper,
  Divider,
  AlertInfoWrapper,
  StakingClaimAmountWrapper,
  StakingClaimAmountText,
  StakingClaimAmountTitle,
  StakingClaimAmountInnerWrapper,
  PresentIcon,
} from "./StakingReward.styles";

type StakingRewardPropType = {
  claimableAmount: number;
};

export const StakingReward = ({ claimableAmount }: StakingRewardPropType) => {
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
      <InnerWrapper>
        <StakingClaimAmountWrapper>
          <StakingClaimAmountTitle>Claimable Rewards</StakingClaimAmountTitle>
          <StakingClaimAmountInnerWrapper>
            <PresentIcon />
            <StakingClaimAmountText>
              {formatNumberMaxFracDigits(claimableAmount)}
            </StakingClaimAmountText>
          </StakingClaimAmountInnerWrapper>
        </StakingClaimAmountWrapper>
      </InnerWrapper>
    </Wrapper>
  );
};

export default StakingReward;
