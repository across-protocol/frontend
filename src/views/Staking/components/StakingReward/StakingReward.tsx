import styled from "@emotion/styled";
import { Alert, ButtonV2 } from "components";
import SectionTitleWrapperV2 from "components/SectionTitleWrapperV2";
import { BigNumber } from "ethers";
import { useState } from "react";
import { formatEther, QUERIESV2 } from "utils";
import { repeatableTernaryBuilder } from "utils/ternary";
import { StakingRewardPropType } from "../../types";
import StakingInputBlock from "../StakingInputBlock";
import AcrossLogo from "assets/Across-logo-bullet.svg";
import { Card } from "views/Staking/Staking.styles";
import { Text } from "components/Text";

export const StakingReward = ({
  poolData: { outstandingRewards },
  isConnected,
  walletConnectionHandler,
}: StakingRewardPropType) => {
  const [amountToClaim, setAmountToClaim] = useState("");
  const [isTransitioning] = useState(false);

  const activeColor = "white-" + (outstandingRewards.gt(0) ? 100 : 70);

  const valueOrEmpty = repeatableTernaryBuilder(
    isConnected && BigNumber.from(outstandingRewards).gt(0),
    <>-</>
  );

  return (
    <SectionTitleWrapperV2 title="Rewards">
      <StakingRewardCard>
        <Alert status="warn">
          <Text weight={400} color="warning">
            Claiming tokens will reset your multiplier and decrease your APY
            from pool + base_rewards * multiplier% to pool + base_rewards * 1%.
          </Text>
        </Alert>
        {isConnected ? (
          <ClaimRewardInputGroup>
            <RewardClaimWrapper>
              <Text color="white-70">Claimable rewards</Text>
              {valueOrEmpty(
                <Text color={activeColor}>
                  {formatEther(outstandingRewards)} ACX
                </Text>
              )}
            </RewardClaimWrapper>
            <ClaimRewardButton
              size="lg"
              disabled={BigNumber.from(outstandingRewards).lte(0)}
            >
              <Text color="warning" weight={500}>
                Claim Rewards
              </Text>
            </ClaimRewardButton>
          </ClaimRewardInputGroup>
        ) : (
          <ButtonGroupWrapper>
            <StakingInputBlock
              value={amountToClaim}
              setValue={setAmountToClaim}
              maxValue=""
              valid
              logoURI={AcrossLogo}
              buttonText="Connect wallet to claim"
              onClickHandler={walletConnectionHandler}
              displayLoader={isTransitioning}
              omitInput
            />
          </ButtonGroupWrapper>
        )}
      </StakingRewardCard>
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

  @media ${QUERIESV2.sm.andDown} {
    padding: 0 16px;
    height: 48px;
  }
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

  text-transform: capitalize;

  background: transparent;

  @media ${QUERIESV2.sm.andDown} {
    height: 40px;
  }
`;

const ButtonGroupWrapper = styled.div`
  width: 100%;
`;

const StakingRewardCard = styled(Card)`
  gap: 16px;
  @media ${QUERIESV2.sm.andDown} {
    padding: 16px;
  }
`;

const ClaimRewardInputGroup = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 12px;
`;
