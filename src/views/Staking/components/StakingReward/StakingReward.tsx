import { useState } from "react";
import { formatEther, isNumberEthersParseable, parseEther } from "utils";
import { repeatableTernaryBuilder } from "utils/ternary";
import { StakingRewardPropType } from "../../types";
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

export const StakingReward = ({
  maximumClaimableAmount,
  isConnected,
  walletConnectionHandler,
}: StakingRewardPropType) => {
  const [amountToClaim, setAmountToClaim] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const buttonHandler = isConnected
    ? // Default do nothing
      () => {
        setIsTransitioning(true);
      }
    : walletConnectionHandler;

  const buttonTextPrefix = isConnected ? "" : "Connect wallet to ";

  const valueOrEmpty = repeatableTernaryBuilder(isConnected, <>-</>);

  // Stub Function
  const stakingAmountValidationHandler = (value: string): boolean => {
    if (isNumberEthersParseable(value)) {
      const numericalValue = parseEther(value);
      return (
        numericalValue.gt("0") && numericalValue.lte(maximumClaimableAmount)
      );
    } else {
      return false;
    }
  };

  // Stub Function
  const isAmountExceeded = (value: string): boolean => {
    return (
      isNumberEthersParseable(value) &&
      parseEther(value).gt(maximumClaimableAmount)
    );
  };

  return (
    <Wrapper>
      <InnerWrapper>
        <Title>Rewards</Title>
      </InnerWrapper>
      <StakingInputBlockWrapper>
        {isConnected && (
          <AlertInfo>
            Claiming tokens will reset your multiplier and decrease your ACX APY
          </AlertInfo>
        )}
        <StakingInputBlock
          value={amountToClaim}
          setValue={setAmountToClaim}
          Logo={StyledAcrossLogo}
          buttonText={`${buttonTextPrefix} claim`}
          valid={!isConnected || stakingAmountValidationHandler(amountToClaim)}
          maxValue={formatEther(maximumClaimableAmount)}
          omitInput={!isConnected}
          onClickHandler={buttonHandler}
          displayLoader={isTransitioning}
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
          {valueOrEmpty(
            <StakingClaimAmountInnerWrapper>
              <PresentIcon />
              <StakingClaimAmountText>
                {formatEther(maximumClaimableAmount)}
              </StakingClaimAmountText>
            </StakingClaimAmountInnerWrapper>
          )}
        </StakingClaimAmountWrapper>
      </InnerWrapper>
    </Wrapper>
  );
};

export default StakingReward;
