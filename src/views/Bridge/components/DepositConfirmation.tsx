import styled from "@emotion/styled";
import BgBanner from "assets/bg-banners/deposit-banner.svg";
import { Text } from "components";
import { ReactComponent as CheckStarIcon } from "assets/check-star-ring-opaque-filled.svg";
import {
  GetBridgeFeesResult,
  getChainInfo,
  getToken,
  receiveAmount,
} from "utils";
import { ReactComponent as ExternalLinkIcon } from "assets/icons/arrow-external-link-16.svg";
import EstimatedTable from "./EstimatedTable";
import { BigNumber } from "ethers";
import { SecondaryButtonWithoutShadow as UnstyledButton } from "components/Buttons";

type DepositConfirmationProps = {
  currentFromRoute: number | undefined;
  currentToRoute: number | undefined;
  currentToken: string;

  fees: GetBridgeFeesResult | undefined;
  amountToBridge: BigNumber | undefined;
  estimatedTime: string | undefined;

  isConnected: boolean;
};

const DepositConfirmation = ({
  currentFromRoute,
  currentToRoute,
  currentToken,
  fees,
  amountToBridge,
  estimatedTime,
  isConnected,
}: DepositConfirmationProps) => {
  return (
    <Wrapper>
      <TopWrapper>
        <TopWrapperAnimationWrapper>
          <AnimatedLogoWrapper>
            <AnimatedLogo src={getChainInfo(currentFromRoute ?? 1).logoURI} />
          </AnimatedLogoWrapper>
          <AnimatedDivider />
          <StyledCheckStarIcon />
          <AnimatedDivider />
          <AnimatedLogoWrapper>
            <AnimatedLogo src={getChainInfo(currentToRoute ?? 1).logoURI} />
          </AnimatedLogoWrapper>
        </TopWrapperAnimationWrapper>
        <TopWrapperTitleWrapper>
          <Text size="3xl" color="white">
            00h 00m 01s
          </Text>
          <Text size="lg" color="grey-400">
            Deposit in progress
          </Text>
        </TopWrapperTitleWrapper>
      </TopWrapper>
      <ActionCardContainer>
        <ActionCard>
          <ActionCardTitleWrapper>
            <Text size="md" color="white">
              Monitor progress
            </Text>
            <Text size="sm" color="grey-400">
              Transactions page
            </Text>
          </ActionCardTitleWrapper>
          <StyledExternalLinkIcon />
        </ActionCard>
        <ActionCard>
          <ActionCardTitleWrapper>
            <Text size="md" color="white">
              Track in Explorer
            </Text>
            <Text size="sm" color="grey-400">
              Etherscan.io
            </Text>
          </ActionCardTitleWrapper>
          <StyledExternalLinkIcon />
        </ActionCard>
      </ActionCardContainer>
      <EstimatedTable
        chainId={currentToRoute ?? 1}
        estimatedTime={estimatedTime}
        gasFee={fees?.relayerGasFee.total}
        bridgeFee={fees?.relayerCapitalFee.total}
        totalReceived={
          fees && amountToBridge && amountToBridge.gt(0)
            ? receiveAmount(amountToBridge, fees)
            : undefined
        }
        token={getToken(currentToken)}
        dataLoaded={isConnected}
      />
      <Divider />
      <Button>
        <Text size="lg" color="white" weight={500}>
          Initiate new transaction
        </Text>
      </Button>
    </Wrapper>
  );
};

export default DepositConfirmation;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0px 24px 24px;
  gap: 24px;

  border: 1px solid #3e4047;
  border-radius: 16px;

  overflow: clip;
  background: #34353b;
`;

const TopWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;

  background-image: url(${BgBanner});
  background-color: #2d2e33;
  border-bottom: 1px solid #3e4047;

  width: calc(100% + 48px);
  margin: 0 -24px;
  padding: 45px 24px 34px;
`;

const TopWrapperTitleWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0px;
  gap: 8px;

  width: 100%;
`;

const TopWrapperAnimationWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0px;
  gap: 8px;
`;

const StyledCheckStarIcon = styled(CheckStarIcon)<{ completed?: boolean }>`
  & * {
    stroke: ${({ completed }) => (completed ? "#6cf9d8" : "#9daab3")};
  }
  flex-shrink: 0;
`;

const AnimatedDivider = styled.div<{ completed?: boolean }>`
  width: 50px;
  height: 1px;
  background: ${({ completed }) => (completed ? "#6cf9d8" : "#9daab3")};
  flex-shrink: 0;
`;

const AnimatedLogoWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;

  width: 60px;
  height: 60px;

  background: #2d2e33;

  border: 1px solid #9daab3;
  border-radius: 100px;

  flex-shrink: 0;
`;

const AnimatedLogo = styled.img`
  width: 48px;
  height: 48px;
`;

const ActionCardContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 16px;
  width: 100%;
`;

const ActionCard = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  gap: 8px;

  height: 64px;
  width: 100%;

  background: #3e4047;
  border: 1px solid #4c4e57;
  border-radius: 8px;
`;

const ActionCardTitleWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
`;

const StyledExternalLinkIcon = styled(ExternalLinkIcon)`
  height: 32px;
  width: 32px;
  flex-shrink: 0;
  cursor: pointer;
  & * {
    stroke: #9daab3;
  }
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: #3e4047;
`;

const Button = styled(UnstyledButton)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;

  background: transparent;
  border-radius: 32px;
  border: 1px solid #9daab3;
  height: 64px;
  width: 100%;
`;
