import styled from "@emotion/styled";
import { Alert, ButtonV2 } from "components";
import SectionTitleWrapperV2 from "components/SectionTitleWrapperV2";
import { BigNumber } from "ethers";
import { formatEther, QUERIESV2 } from "utils";
import { repeatableTernaryBuilder } from "utils/ternary";
import { StakingRewardPropType } from "../../types";
import { Text } from "components/Text";
import ConnectWalletButton from "../ConnectWalletButton";
import BouncingDotsLoader from "components/BouncingDotsLoader";
import CardWrapper from "components/CardWrapper";

export const StakingReward = ({
  poolData: { outstandingRewards },
  isConnected,
  claimActionHandler,
  isMutating,
}: StakingRewardPropType) => {
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
            Claiming tokens will reset your multiplier to 1 and decrease your
            APY to the base reward APY.
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
              disabled={BigNumber.from(outstandingRewards).lte(0) || isMutating}
              onClick={() => claimActionHandler()}
            >
              <Text color="warning" weight={500}>
                Claim Rewards
              </Text>
              {isMutating && <BouncingDotsLoader dotColor="warning" />}
            </ClaimRewardButton>
          </ClaimRewardInputGroup>
        ) : (
          <ConnectWalletButton reasonToConnect="claim rewards" />
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

  &:active:after {
    border: none;
  }
`;

const StakingRewardCard = styled(CardWrapper)`
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
