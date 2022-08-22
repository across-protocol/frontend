import { formatNumberMaxFracDigits } from "utils";
import { AlertInfo } from "./AlertInfo";
import {
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
        <AlertInfo text="Claiming tokens will reset your multiplier and decrease your ACX APY" />
        <AlertInfo
          text="The amount entered exceeds your claimable amount"
          danger={true}
        />
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
