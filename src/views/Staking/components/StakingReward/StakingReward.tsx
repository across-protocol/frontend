import styled from "@emotion/styled";
import { Alert, ButtonV2 } from "components";
import SectionTitleWrapperV2 from "components/SectionTitleWrapperV2";
import { BigNumber } from "ethers";
import { useState } from "react";
import { formatEther } from "utils";
import { repeatableTernaryBuilder } from "utils/ternary";
import { StakingRewardPropType } from "../../types";
import StakingInputBlock from "../StakingInputBlock";
import { ReactComponent as AcrossLogo } from "assets/Across-logo-bullet.svg";
import { Card } from "views/Staking/Staking.styles";

export const StakingReward = ({
  maximumClaimableAmount,
  isConnected,
  walletConnectionHandler,
  usersMultiplierPercentage,
}: StakingRewardPropType) => {
  const [amountToClaim, setAmountToClaim] = useState("");
  const [isTransitioning] = useState(false);

  const valueOrEmpty = repeatableTernaryBuilder(
    isConnected && BigNumber.from(maximumClaimableAmount).gt(0),
    <>-</>
  );

  return (
    <SectionTitleWrapperV2 title="Rewards">
      <Card>
        <Alert status="warn">
          <AlertText>
            Claiming tokens will reset your multiplier and decrease your ACX APY
            from X% to Y%
          </AlertText>
        </Alert>
        {isConnected ? (
          <>
            <RewardClaimWrapper>
              <RewardClaimWrapperTitle>
                Claimable Rewards
              </RewardClaimWrapperTitle>
              {valueOrEmpty(
                <RewardClaimWrapperReward>
                  {formatEther(maximumClaimableAmount)} ACX
                </RewardClaimWrapperReward>
              )}
            </RewardClaimWrapper>
            <ClaimRewardButton size="lg"> Claim Rewards </ClaimRewardButton>
          </>
        ) : (
          <ButtonGroupWrapper>
            <StakingInputBlock
              value={amountToClaim}
              setValue={setAmountToClaim}
              maxValue=""
              valid
              Logo={StyledAcrossLogo}
              buttonText="Connect wallet to claim"
              onClickHandler={walletConnectionHandler}
              displayLoader={isTransitioning}
              omitInput
            />
          </ButtonGroupWrapper>
        )}
      </Card>
    </SectionTitleWrapperV2>
  );
};

export default StakingReward;

const RewardClaimWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;

  height: 64px;
  width: 100%;

  border: 1px solid #3e4047;
  border-radius: 12px;
`;

const RewardClaimWrapperTitle = styled.span`
  font-weight: 400;
  font-size: 18px;
  line-height: 26px;
  color: #9daab2;
`;
const RewardClaimWrapperReward = styled.span`
  font-weight: 400;
  font-size: 18px;
  line-height: 26px;
  color: #e0f3ff;
`;

const ClaimRewardButton = styled(ButtonV2)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0px 40px;
  gap: 4px;

  height: 64px;
  width: 100%;

  border: 1px solid #f9d26c;
  border-radius: 32px;

  font-weight: 500;
  font-size: 18px;
  line-height: 26px;
  color: #f9d26c;
  text-transform: capitalize;

  background: transparent;
`;

const ButtonGroupWrapper = styled.div`
  width: 100%;
`;

const AlertText = styled.p`
  font-weight: 400;
  font-size: 16px;
  line-height: 20px;
  color: #f9d26c;
`;

const StyledAcrossLogo = styled(AcrossLogo)``;
