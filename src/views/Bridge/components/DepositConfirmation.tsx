import styled from "@emotion/styled";
import BgBanner from "assets/bg-banners/deposit-banner.svg";
import { Text } from "components";
import { ReactComponent as CheckStarIcon } from "assets/check-star-ring-opaque-filled.svg";
import { ChainId, GetBridgeFeesResult, getToken, receiveAmount } from "utils";
import { ReactComponent as ExternalLinkIcon } from "assets/icons/arrow-external-link-16.svg";
import EstimatedTable from "./EstimatedTable";
import { BigNumber } from "ethers";
import { SecondaryButtonWithoutShadow as UnstyledButton } from "components/Buttons";
import { keyframes } from "@emotion/react";
import { ReactComponent as EthereumGrayscaleLogo } from "assets/grayscale-logos/eth.svg";
import { ReactComponent as PolygonGrayscaleLogo } from "assets/grayscale-logos/polygon.svg";
import { ReactComponent as ArbitrumGrayscaleLogo } from "assets/grayscale-logos/arbitrum.svg";
import { ReactComponent as OptimismGrayscaleLogo } from "assets/grayscale-logos/optimism.svg";
import { getReceiveTokenSymbol } from "../utils";
import { ToAccount } from "../hooks/useToAccount";

type DepositConfirmationProps = {
  currentFromRoute: number | undefined;
  currentToRoute: number | undefined;
  currentToken: string;
  toAccount?: ToAccount;

  fees: GetBridgeFeesResult | undefined;
  amountToBridge: BigNumber | undefined;
  estimatedTime: string | undefined;

  isConnected: boolean;
  transactionPending: boolean;
  onTxHashChange: (txHash?: string) => void;

  explorerLink?: string;
  elapsedTimeFromDeposit?: string;
};

const DepositConfirmation = ({
  currentFromRoute,
  currentToRoute,
  currentToken,
  toAccount,
  fees,
  amountToBridge,
  estimatedTime,
  isConnected,
  transactionPending,
  onTxHashChange,
  explorerLink,
  elapsedTimeFromDeposit,
}: DepositConfirmationProps) => {
  const LogoMapping: {
    [key: number]: JSX.Element;
  } = {
    [ChainId.ARBITRUM]: <ArbitrumGrayscaleLogo />,
    [ChainId.POLYGON]: <PolygonGrayscaleLogo />,
    [ChainId.OPTIMISM]: <OptimismGrayscaleLogo />,
    [ChainId.MAINNET]: <EthereumGrayscaleLogo />,
    [ChainId.GOERLI]: <EthereumGrayscaleLogo />,
    [ChainId.ARBITRUM_GOERLI]: <EthereumGrayscaleLogo />,
    [ChainId.MUMBAI]: <EthereumGrayscaleLogo />,
  };

  return (
    <Wrapper data-cy="transaction-submitted">
      <TopWrapper>
        <TopWrapperAnimationWrapper>
          <AnimatedLogoWrapper completed={!transactionPending}>
            <AnimatedLogo completed={!transactionPending}>
              {LogoMapping[currentFromRoute ?? 1]}
            </AnimatedLogo>
          </AnimatedLogoWrapper>
          <AnimatedDivider completed={!transactionPending} />
          <StyledCheckStarIcon completed={!transactionPending} />
          <AnimatedDivider completed={!transactionPending} />
          <AnimatedLogoWrapper completed={!transactionPending}>
            <AnimatedLogo completed={!transactionPending}>
              {LogoMapping[currentToRoute ?? 1]}
            </AnimatedLogo>
          </AnimatedLogoWrapper>
        </TopWrapperAnimationWrapper>
        {transactionPending ? (
          <TopWrapperTitleWrapper>
            <Text size="3xl" color="white">
              {elapsedTimeFromDeposit ?? "00h 00m 00s"}
            </Text>
            <Text size="lg" color="grey-400">
              Deposit in progress
            </Text>
          </TopWrapperTitleWrapper>
        ) : (
          <AnimatedTopWrapperTitleWrapper>
            <Text size="3xl" color="aqua">
              Deposit successful!
            </Text>
            <Text size="lg" color="grey-400">
              Finished in{" "}
              <WhiteSpanText>
                {elapsedTimeFromDeposit ?? "00h 00m 00s"}
              </WhiteSpanText>
            </Text>
          </AnimatedTopWrapperTitleWrapper>
        )}
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
          <ExternalContainerIconAnchor target="_blank" href="/transactions">
            <StyledExternalLinkIcon />
          </ExternalContainerIconAnchor>
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
          <ExternalContainerIconAnchor
            href={explorerLink ?? "https://etherscan.io"}
            target="_blank"
          >
            <StyledExternalLinkIcon />
          </ExternalContainerIconAnchor>
        </ActionCard>
      </ActionCardContainer>
      <EstimatedTable
        chainId={currentToRoute ?? 1}
        estimatedTime={estimatedTime}
        gasFee={fees?.relayerGasFee.total}
        bridgeFee={
          fees && amountToBridge && amountToBridge.gt(0)
            ? receiveAmount(amountToBridge, fees).deductionsSansRelayerGas
            : undefined
        }
        totalReceived={
          fees && amountToBridge && amountToBridge.gt(0)
            ? receiveAmount(amountToBridge, fees).receivable
            : undefined
        }
        token={getToken(currentToken)}
        dataLoaded={isConnected}
        receiveToken={getToken(
          getReceiveTokenSymbol(
            currentToRoute || 1,
            currentToken,
            Boolean(toAccount?.isContract)
          )
        )}
      />
      <Divider />
      <Button
        disabled={transactionPending}
        onClick={() => {
          onTxHashChange(undefined);
        }}
      >
        <Text
          size="lg"
          color={!transactionPending ? "aqua" : "white"}
          weight={500}
        >
          Initiate new transaction
        </Text>
      </Button>
    </Wrapper>
  );
};

export default DepositConfirmation;

const AnimationFadeInBottom = keyframes`
  from {
    opacity: 0;
    transform: translateY(20%);
  }
  to { opacity: 1 }
`;

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

  animation-name: ${AnimationFadeInBottom};
  animation-duration: 1s;
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

const AnimatedTopWrapperTitleWrapper = styled(TopWrapperTitleWrapper)`
  animation-name: ${AnimationFadeInBottom};
  animation-duration: 1s;
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
    transition: stroke 0.5s ease-in-out;
  }
  flex-shrink: 0;
`;

const AnimatedDivider = styled.div<{ completed?: boolean }>`
  width: ${({ completed }) => (completed ? "22px" : "50px")};
  height: 1px;
  background: ${({ completed }) => (completed ? "#6cf9d8" : "#9daab3")};
  flex-shrink: 0;

  transition: width 0.5s ease-in-out, background-color 0.5s ease-in-out;
`;

const AnimatedLogoWrapper = styled.div<{ completed?: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;

  width: 60px;
  height: 60px;

  background: #2d2e33;

  border: 1px solid;
  border-color: ${({ completed }) => (completed ? "#6cf9d8" : "#9daab3")};
  transition: border-color 0.5s ease-in-out;

  border-radius: 100px;

  flex-shrink: 0;
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

const ExternalContainerIconAnchor = styled.a`
  height: 32px;
  width: 32px;
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: #3e4047;
`;

const Button = styled(UnstyledButton)<{ disabled?: boolean }>`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;

  background: transparent;
  border-radius: 32px;
  border: 1px solid ${({ disabled }) => (disabled ? "#9daab3" : "#6cf9d8")};
  height: 64px;
  width: 100%;

  transition: border-color 0.5s ease-in-out;

  > * {
    transition: color 0.5s ease-in-out;
  }
`;

const WhiteSpanText = styled.span`
  color: #ffffff;
`;

const AnimatedLogo = styled.div<{
  completed?: boolean;
}>`
  width: 48px;
  height: 48px;
  & svg {
    width: 48px;
    height: 48px;
    border-radius: 100%;
    & rect {
      transition: fill 1s ease-in-out;
      fill: ${({ completed }) => (completed ? "#6cf9d8" : "#9daab3")};
    }
  }
`;
