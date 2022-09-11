import { useState } from "react";
import { formatEther, isNumericWithinRange, parseEtherLike } from "utils";
import { repeatableTernaryBuilder } from "utils/ternary";
import { StakingRewardPropType } from "../../types";
import StakingInputBlock from "../StakingInputBlock";
import { AlertInfo } from "./AlertInfo";
import {
  Title,
  Card,
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
  const [isTransitioning] = useState(false);

  const buttonHandler = isConnected ? () => {} : walletConnectionHandler;
  const buttonTextPrefix = isConnected ? "" : "Connect wallet to ";
  const buttonMaxValue = formatEther(maximumClaimableAmount);

  const valueOrEmpty = repeatableTernaryBuilder(isConnected, <>-</>);

  // Stub Function
  const stakingAmountValidationHandler = (value: string): boolean =>
    isNumericWithinRange(
      value,
      true,
      "0",
      maximumClaimableAmount,
      parseEtherLike
    );

  // Stub Function
  const isAmountExceeded = (value: string): boolean =>
    isNumericWithinRange(
      value,
      false,
      maximumClaimableAmount,
      undefined,
      parseEtherLike
    );

  // Stub
  const errorMessage = (): string => {
    if (isAmountExceeded(amountToClaim)) {
      return "The amount entered exceeds your claimable amount";
    } else {
      return "";
    }
  };

  return (
    <Card>
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
          maxValue={buttonMaxValue}
          omitInput={!isConnected}
          onClickHandler={buttonHandler}
          displayLoader={isTransitioning}
          errorMessage={errorMessage()}
        />
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
    </Card>
  );
};

export default StakingReward;
