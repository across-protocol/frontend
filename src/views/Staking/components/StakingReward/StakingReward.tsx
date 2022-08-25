import { BigNumberish } from "ethers";
import { useState } from "react";
import { formatEther, isNumberEthersParseable, parseEther } from "utils";
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
  maximumClaimableAmount: BigNumberish;
  isConnected: boolean;
  connectWalletHandler: () => void;
};

export const StakingReward = (props: StakingRewardPropType) => {
  const [amountToClaim, setAmountToClaim] = useState("");

  const buttonHandler = props.isConnected
    ? // Default do nothing
      () => {}
    : props.connectWalletHandler;

  // Stub Function
  const stakingAmountValidationHandler = (value: string): boolean => {
    if (isNumberEthersParseable(value)) {
      const numericalValue = parseEther(value);
      return (
        numericalValue.gt("0") &&
        numericalValue.lte(props.maximumClaimableAmount)
      );
    } else {
      return false;
    }
  };

  // Stub Function
  const isAmountExceeded = (value: string): boolean => {
    return (
      isNumberEthersParseable(value) &&
      parseEther(value).gt(props.maximumClaimableAmount)
    );
  };

  return (
    <Wrapper>
      <InnerWrapper>
        <Title>Rewards</Title>
      </InnerWrapper>
      <StakingInputBlockWrapper>
        <AlertInfo>
          Claiming tokens will reset your multiplier and decrease your ACX APY
        </AlertInfo>
        <StakingInputBlock
          value={amountToClaim}
          setValue={setAmountToClaim}
          Logo={StyledAcrossLogo}
          buttonText={props.isConnected ? "Claim" : "Connect"}
          valid={
            !props.isConnected || stakingAmountValidationHandler(amountToClaim)
          }
          maxValue={formatEther(props.maximumClaimableAmount)}
          onClickHandler={buttonHandler}
        />
        {isAmountExceeded(amountToClaim) && (
          <AlertInfo danger>
            The amount entered exceeds your claimable amount
          </AlertInfo>
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
              {formatEther(props.maximumClaimableAmount)}
            </StakingClaimAmountText>
          </StakingClaimAmountInnerWrapper>
        </StakingClaimAmountWrapper>
      </InnerWrapper>
    </Wrapper>
  );
};

export default StakingReward;
