import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";

import BgBanner from "assets/bg-banners/deposit-banner.svg";

import { ReactComponent as InfoIcon } from "assets/icons/info.svg";
import { Text, Badge } from "components";

import { COLORS, NoFundsDepositedLogError, getFillTxExplorerLink } from "utils";
import { useElapsedSeconds } from "hooks/useElapsedSeconds";

import { useDepositTracking } from "../hooks/useDepositTracking";
import { DepositTimesCard } from "./DepositTimesCard";
import { ElapsedTime } from "./ElapsedTime";
import DepositStatusAnimatedIcons from "./DepositStatusAnimatedIcons";
import { FromBridgeAndSwapPagePayload } from "utils/local-deposits";
import { BridgeProvider } from "../hooks/useDepositTracking/types";
import { useTokenFromAddress } from "hooks/useToken";
import { useDepositByTxHash } from "hooks/useDepositStatus";
import { formatUnits } from "ethers/lib/utils";
import { BigNumber } from "ethers";

type Props = {
  depositTxHash: string;
  fromChainId: number;
  toChainId: number;
  externalProjectId?: string;
  inputTokenSymbol: string;
  outputTokenSymbol?: string;
  fromBridgeAndSwapPagePayload?: FromBridgeAndSwapPagePayload;
  bridgeProvider?: BridgeProvider;
};

export function DepositStatusUpperCard({
  depositTxHash,
  fromChainId,
  toChainId,
  bridgeProvider,
  externalProjectId,
  inputTokenSymbol,
  outputTokenSymbol,
  fromBridgeAndSwapPagePayload,
}: Props) {
  const { depositQuery, status, deposit, fill } = useDepositTracking({
    depositTxHash,
    fromChainId,
    toChainId,
    bridgeProvider,
    fromBridgeAndSwapPagePayload,
  });
  const { data: indexerDeposit } = useDepositByTxHash(deposit?.depositTxHash);
  const depositTxSentTime = fromBridgeAndSwapPagePayload?.timeSigned;
  const depositTxCompletedTime = deposit?.depositTimestamp;
  const fillTxCompletedTime = fill?.fillTxTimestamp;

  const { elapsedSeconds: depositTxElapsedSeconds } = useElapsedSeconds(
    depositTxSentTime ? Math.floor(depositTxSentTime / 1000) : undefined,
    depositTxCompletedTime
  );
  const { elapsedSeconds: fillTxElapsedSeconds } = useElapsedSeconds(
    depositTxCompletedTime,
    fillTxCompletedTime
  );

  const depositRevertMessage =
    deposit?.status === "deposit-reverted" ? deposit.formattedError : undefined;

  const isSwapFailed = status === "filled" && fill?.actionsSucceeded === false;

  const bridgeToken = useTokenFromAddress(
    indexerDeposit?.deposit.outputToken ?? "",
    Number(indexerDeposit?.deposit.destinationChainId ?? toChainId)
  );

  const scaledOutputBridgedTokenAmount =
    indexerDeposit?.deposit.outputAmount && bridgeToken?.decimals
      ? formatUnits(indexerDeposit.deposit.outputAmount, bridgeToken.decimals)
      : undefined;

  // BigNumber version for DepositTimesCard
  const bridgeOutputAmount = indexerDeposit?.deposit.outputAmount
    ? BigNumber.from(indexerDeposit.deposit.outputAmount)
    : undefined;

  // Fallback input token data from indexer (for when session storage is not available)
  const indexerInputAmount = indexerDeposit?.deposit.inputAmount
    ? BigNumber.from(indexerDeposit.deposit.inputAmount)
    : undefined;

  // This error indicates that the used deposit tx hash does not originate from
  // an Across SpokePool contract.
  if (depositQuery.error instanceof NoFundsDepositedLogError) {
    return (
      <Wrapper>
        <TopWrapperTitleWrapper>
          <Text size="lg" color="error">
            Invalid deposit tx hash
          </Text>
        </TopWrapperTitleWrapper>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <DepositStatusAnimatedIcons
        status={status}
        isSwapFailed={isSwapFailed}
        toChainId={toChainId}
        fromChainId={fromChainId}
        externalProjectId={externalProjectId}
      />
      {status === "filled" && !isSwapFailed ? (
        <AnimatedTopWrapperTitleWrapper>
          <ElapsedTime
            textSize="3xl"
            elapsedSeconds={fillTxElapsedSeconds}
            isCompleted
          />
          <Text size="lg" color="grey-400">
            Transfer successful!
          </Text>
        </AnimatedTopWrapperTitleWrapper>
      ) : status === "filled" && isSwapFailed ? (
        <AnimatedTopWrapperTitleWrapper>
          <SwapFailedRow>
            <Text size="2xl" color="functional-red">
              Destination swap failed
            </Text>
            <Text size="md" color="grey-400">
              {scaledOutputBridgedTokenAmount && bridgeToken?.symbol ? (
                <>
                  Returned{" "}
                  <InlineText color="white">
                    {scaledOutputBridgedTokenAmount} {bridgeToken.symbol}
                  </InlineText>{" "}
                  to your wallet (after bridge fees).{" "}
                </>
              ) : (
                <>Funds returned to your wallet (after bridge fees). </>
              )}
              <InlineLink
                target="_blank"
                rel="noopener noreferrer"
                href={getFillTxExplorerLink(toChainId, fill?.fillTxHash ?? "")}
              >
                View on Explorer
              </InlineLink>
            </Text>
          </SwapFailedRow>
        </AnimatedTopWrapperTitleWrapper>
      ) : status === "deposit-reverted" ? (
        <AnimatedTopWrapperTitleWrapper>
          <DepositRevertedRow>
            <Text size="lg" color="warning">
              {depositRevertMessage ?? "Deposit unsuccessful"}
            </Text>
            <a
              href={getFillTxExplorerLink(fromChainId, depositTxHash)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <InfoIcon />
            </a>
          </DepositRevertedRow>
        </AnimatedTopWrapperTitleWrapper>
      ) : (
        <TopWrapperTitleWrapper>
          <ElapsedTime
            textSize="3xl"
            elapsedSeconds={
              status === "depositing"
                ? depositTxElapsedSeconds
                : fillTxElapsedSeconds
            }
          />
          <SubTitleWrapper>
            <Text size="lg" color="grey-400">
              {status === "depositing"
                ? "Depositing on source chain..."
                : "Filling on destination chain..."}
            </Text>
            <Badge textColor="grey-400">
              <Text size="lg" color="grey-400">
                {status === "depositing" ? "1 / 2" : "2 / 2"}
              </Text>
            </Badge>
          </SubTitleWrapper>
        </TopWrapperTitleWrapper>
      )}
      <DepositTimeCardSocialSharedWrapper>
        <DepositTimesCard
          status={status}
          depositTxCompletedTimestampSeconds={depositTxCompletedTime}
          depositTxElapsedSeconds={depositTxElapsedSeconds}
          fillTxElapsedSeconds={fillTxElapsedSeconds}
          fillTxHash={fill?.fillTxHash}
          outputAmount={fill?.outputAmount}
          depositTxHash={depositTxHash}
          fromChainId={fromChainId}
          toChainId={toChainId}
          inputTokenSymbol={inputTokenSymbol}
          outputTokenSymbol={outputTokenSymbol}
          fromBridgeAndSwapPagePayload={fromBridgeAndSwapPagePayload}
          isSwapFailed={isSwapFailed}
          bridgeOutputToken={
            indexerDeposit?.deposit.outputToken ?? fill?.outputToken
          }
          bridgeOutputAmount={bridgeOutputAmount}
          indexerInputToken={indexerDeposit?.deposit.inputToken}
          indexerInputAmount={indexerInputAmount}
        />
      </DepositTimeCardSocialSharedWrapper>
    </Wrapper>
  );
}

const InlineText = styled(Text)`
  display: inline;
`;

const InlineLink = styled.a`
  display: inline;
  text-decoration: underline;
  color: inherit;

  &:hover {
    color: var(--color-white);
  }
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;

  /* background-image: url(${BgBanner}); */
  background-color: ${COLORS["black-800"]};
  border-bottom: 1px solid ${COLORS["grey-600"]};

  width: calc(100% + 48px);
  margin: 0 -24px;
  padding: 45px 24px 34px;
`;

const DepositTimeCardSocialSharedWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  align-self: stretch;
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

const SubTitleWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 8px;
`;

const AnimationFadeInBottom = keyframes`
  from {
    opacity: 0;
    transform: translateY(20%);
  }
  to { opacity: 1 }
`;

const AnimatedTopWrapperTitleWrapper = styled(TopWrapperTitleWrapper)`
  animation-name: ${AnimationFadeInBottom};
  animation-duration: 1s;
  max-width: 350px;
  text-align: center;
  margin-inline: auto;
`;

const DepositRevertedRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 8px;

  a {
    display: flex;
  }

  svg {
    cursor: pointer;
    height: 20px;
    width: 20px;
    path {
      stroke: ${COLORS.warning};
    }
  }
`;

const SwapFailedRow = styled(DepositRevertedRow)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  a {
    display: inline;
  }
`;
