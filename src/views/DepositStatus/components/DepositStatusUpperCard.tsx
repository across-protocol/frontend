import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";

import BgBanner from "assets/bg-banners/deposit-banner.svg";

import { ReactComponent as InfoIcon } from "assets/icons/info.svg";
import { Text, Badge } from "components";

import { COLORS, NoV3FundsDepositedLogError, getChainInfo } from "utils";
import { useElapsedSeconds } from "hooks/useElapsedSeconds";

import { useDepositTracking } from "../hooks/useDepositTracking";
import { DepositTimesCard } from "./DepositTimesCard";
import { ElapsedTime } from "./ElapsedTime";
import { FromBridgePagePayload } from "views/Bridge/hooks/useBridgeAction";
import { DateTime } from "luxon";
import { useResolveFromBridgePagePayload } from "../hooks/useResolveFromBridgePagePayload";
import { useIndexerDepositsTracking } from "hooks/useIndexerDepositTracking";
import DepositStatusAnimatedIcons from "./DepositStatusAnimatedIcons";

type Props = {
  depositTxHash: string;
  fromChainId: number;
  toChainId: number;
  inputTokenSymbol: string;
  outputTokenSymbol?: string;
  fromBridgePagePayload?: FromBridgePagePayload;
};

export function DepositStatusUpperCard({
  depositTxHash,
  fromChainId,
  toChainId,
  fromBridgePagePayload,
  inputTokenSymbol,
  outputTokenSymbol,
}: Props) {
  const { depositQuery, fillQuery } = useDepositTracking(
    depositTxHash,
    fromChainId,
    toChainId,
    fromBridgePagePayload
  );

  const { estimatedRewards, amountAsBaseCurrency } =
    useResolveFromBridgePagePayload(
      toChainId,
      inputTokenSymbol,
      fromBridgePagePayload
    );

  void useIndexerDepositsTracking([
    { originChainId: fromChainId, depositTxnHash: depositTxHash },
  ]);

  const depositTxSentTime = fromBridgePagePayload?.timeSigned;
  const depositTxCompletedTime = depositQuery.data?.depositTimestamp;
  const fillTxCompletedTime = fillQuery.data?.fillTxTimestamp;

  const { elapsedSeconds: depositTxElapsedSeconds } = useElapsedSeconds(
    depositTxSentTime ? Math.floor(depositTxSentTime / 1000) : undefined,
    depositTxCompletedTime
  );
  const { elapsedSeconds: fillTxElapsedSeconds } = useElapsedSeconds(
    depositTxCompletedTime,
    fillTxCompletedTime
  );

  const status = !depositTxCompletedTime
    ? "depositing"
    : depositQuery.data?.depositTxReceipt.status === 0
      ? "deposit-reverted"
      : !fillTxCompletedTime
        ? "filling"
        : "filled";

  // This error indicates that the used deposit tx hash does not originate from
  // an Across SpokePool contract.
  if (depositQuery.error instanceof NoV3FundsDepositedLogError) {
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
        toChainId={toChainId}
        fromChainId={fromChainId}
      />
      {status === "filled" ? (
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
      ) : status === "deposit-reverted" ? (
        <AnimatedTopWrapperTitleWrapper>
          {depositTxElapsedSeconds ? (
            <ElapsedTime
              textSize="3xl"
              elapsedSeconds={depositTxElapsedSeconds}
              textColor="warning"
            />
          ) : (
            <Text size="3xl" color="warning">
              {DateTime.fromSeconds(
                depositTxCompletedTime || Date.now()
              ).toFormat("d MMM yyyy - t")}
            </Text>
          )}
          <DepositRevertedRow>
            <Text size="lg" color="warning">
              Deposit unsuccessful
            </Text>
            <a
              href={`${
                getChainInfo(fromChainId).explorerUrl
              }/tx/${depositTxHash}`}
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
          fillTxHash={fillQuery.data?.fillTxHashes[0]}
          depositTxHash={depositTxHash}
          fromChainId={fromChainId}
          toChainId={toChainId}
          inputTokenSymbol={inputTokenSymbol}
          outputTokenSymbol={outputTokenSymbol}
          amountSent={amountAsBaseCurrency?.toString()}
          netFee={estimatedRewards?.netFeeAsBaseCurrency?.toString()}
        />
      </DepositTimeCardSocialSharedWrapper>
    </Wrapper>
  );
}

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
