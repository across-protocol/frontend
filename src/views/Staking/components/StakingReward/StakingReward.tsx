import { useState } from "react";
import { formatNumberMaxFracDigits } from "utils";
import StakingInputBlock from "../StakingInputBlock";
import { AlertInfo } from "./AlertInfo";
import {
  Title,
  Wrapper,
  InnerWrapper,
  Divider,
  StakingClaimAmountWrapper,
  StakingClaimAmountText,
  StakingClaimAmountTitle,
  StakingClaimAmountInnerWrapper,
  PresentIcon,
  StyledAcrossLogo,
  StakingInputBlockWrapper,
} from "./StakingReward.styles";

type StakingRewardPropType = {
  maximumClaimableAmount: number;
};

export const StakingReward = ({
  maximumClaimableAmount,
}: StakingRewardPropType) => {
  const [amountToClaim, setAmountToClaim] = useState("");

  // Stub Function
  const stakingAmountValidationHandler = (value: string): boolean => {
    const numericValue = Number(value);
    return (
      !Number.isNaN(numericValue) &&
      numericValue > 0 &&
      numericValue <= maximumClaimableAmount
    );
  };

  // Stub Function
  const isAmountExceeded = (value: string): boolean => {
    const numericValue = Number(value);
    return !Number.isNaN(numericValue) && numericValue > maximumClaimableAmount;
  };

  return (
    <Wrapper>
      <InnerWrapper>
        <Title>Rewards</Title>
      </InnerWrapper>
      <StakingInputBlockWrapper>
        <AlertInfo text="Claiming tokens will reset your multiplier and decrease your ACX APY" />
        <StakingInputBlock
          value={amountToClaim}
          setValue={setAmountToClaim}
          Logo={StyledAcrossLogo}
          buttonText="Claim"
          valid={stakingAmountValidationHandler(amountToClaim)}
          maxValue={String(maximumClaimableAmount)}
        />
        {isAmountExceeded(amountToClaim) && (
          <AlertInfo
            text="The amount entered exceeds your claimable amount"
            danger={true}
          />
        )}
      </StakingInputBlockWrapper>
      <InnerWrapper>
        <Divider />
      </InnerWrapper>
      <InnerWrapper>
        <StakingClaimAmountWrapper>
          <StakingClaimAmountTitle>Claimable Rewards</StakingClaimAmountTitle>
          <StakingClaimAmountInnerWrapper>
            <PresentIcon />
            <StakingClaimAmountText>
              {formatNumberMaxFracDigits(maximumClaimableAmount)}
            </StakingClaimAmountText>
          </StakingClaimAmountInnerWrapper>
        </StakingClaimAmountWrapper>
      </InnerWrapper>
    </Wrapper>
  );
};

export default StakingReward;
