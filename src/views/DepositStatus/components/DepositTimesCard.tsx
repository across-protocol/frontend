import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
import { DateTime } from "luxon";
import { Link } from "react-router-dom";

import { ReactComponent as CheckIcon } from "assets/icons/check.svg";
import { ReactComponent as LoadingIcon } from "assets/icons/loading.svg";
import { ReactComponent as ExternalLinkIcon } from "assets/icons/arrow-up-right.svg";
import { ReactComponent as RefreshIcon } from "assets/icons/refresh.svg";
import { ReactComponent as ChevronIcon } from "assets/icons/chevron-down.svg";

import { Text } from "components";
import {
  getChainInfo,
  COLORS,
  getBridgeUrlWithQueryParams,
  isDefined,
  formatUSD,
} from "utils";
import { useAmplitude } from "hooks";
import { ampli } from "ampli";

import { ElapsedTime } from "./ElapsedTime";
import { DepositStatus } from "../types";
import { usePMFForm } from "hooks/usePMFForm";
import { useState } from "react";

type Props = {
  status: DepositStatus;
  depositTxCompletedTimestampSeconds?: number;
  depositTxElapsedSeconds?: number;
  fillTxElapsedSeconds?: number;
  fillTxHash?: string;
  depositTxHash?: string;
  fromChainId: number;
  toChainId: number;
  inputTokenSymbol: string;
  outputTokenSymbol?: string;
  amountSent?: string;
  netFee?: string;
  bridgeFee?: string;
  gasFee?: string;
};

export function DepositTimesCard({
  status,
  depositTxCompletedTimestampSeconds,
  depositTxElapsedSeconds,
  fillTxElapsedSeconds,
  fillTxHash,
  depositTxHash,
  fromChainId,
  toChainId,
  inputTokenSymbol,
  outputTokenSymbol,
  amountSent,
  netFee,
  bridgeFee,
  gasFee,
}: Props) {
  const isDepositing = status === "depositing";
  const isFilled = status === "filled";
  const isDepositReverted = status === "deposit-reverted";

  const { isPMFormAvailable } = usePMFForm();

  const { addToAmpliQueue } = useAmplitude();

  return (
    <CardWrapper>
      <Row>
        <Text color="grey-400">Deposit time</Text>
        {isDepositing ? (
          <ElapsedTime
            elapsedSeconds={depositTxElapsedSeconds}
            isCompleted={false}
            StatusIcon={<StyledLoadingIcon />}
          />
        ) : isDepositReverted ? (
          <TryAgainButton
            to={getBridgeUrlWithQueryParams({
              fromChainId,
              toChainId,
              inputTokenSymbol,
              outputTokenSymbol,
            })}
          >
            <Text color="warning">Try again</Text>
            <RefreshIcon />
          </TryAgainButton>
        ) : depositTxElapsedSeconds !== undefined ? (
          <ElapsedTime
            elapsedSeconds={depositTxElapsedSeconds}
            isCompleted
            StatusIcon={
              <CheckIconExplorerLink
                txHash={depositTxHash}
                chainId={fromChainId}
              />
            }
          />
        ) : (
          <DateWrapper>
            <Text color={"aqua"}>
              {depositTxCompletedTimestampSeconds
                ? DateTime.fromSeconds(
                    depositTxCompletedTimestampSeconds
                  ).toFormat("d MMM yyyy - t")
                : "-"}
            </Text>
            <CheckIconExplorerLink
              txHash={depositTxHash}
              chainId={fromChainId}
            />
          </DateWrapper>
        )}
      </Row>
      <Row>
        <Text color="grey-400">Fill time</Text>
        {isDepositing || status === "deposit-reverted" ? (
          <Text>-</Text>
        ) : (
          <ElapsedTime
            elapsedSeconds={fillTxElapsedSeconds}
            isCompleted={isFilled}
            StatusIcon={
              isFilled ? (
                <CheckIconExplorerLink
                  txHash={fillTxHash}
                  chainId={toChainId}
                />
              ) : (
                <StyledLoadingIcon />
              )
            }
          />
        )}
      </Row>
      {(netFee || amountSent) && <Divider />}
      {isPMFormAvailable && (
        <PMFAwareFeeSentRow
          amountSent={amountSent}
          netFee={netFee}
          bridgeFee={bridgeFee}
          gasFee={gasFee}
        />
      )}
      {!isPMFormAvailable && (
        <>
          {isDefined(netFee) && (
            <Row>
              <Text color="grey-400">Net fee</Text>
              <Text color="grey-400">${formatUSD(netFee)}</Text>
            </Row>
          )}
          {isDefined(amountSent) && (
            <Row>
              <Text color="grey-400">Amount sent</Text>
              <Text color="grey-400">${formatUSD(amountSent)}</Text>
            </Row>
          )}
        </>
      )}
      <Divider />
      <TransactionsPageLinkWrapper
        href="/transactions"
        target="_blank"
        rel="noreferrer"
        onClick={() => {
          addToAmpliQueue(() => {
            ampli.monitorDepositProgressClicked({
              action: "onClick",
              element: "monitorDepositProgressLink",
              page: "bridgePage",
              section: "depositConfirmation",
            });
          });
        }}
      >
        <Text color="grey-400">
          View on{" "}
          <Text color="white" as="span">
            Transactions page
          </Text>
        </Text>
        <ExternalLinkIcon />
      </TransactionsPageLinkWrapper>
    </CardWrapper>
  );
}

const PMFAwareFeeSentRow = ({
  netFee,
  amountSent,
  bridgeFee,
  gasFee,
}: {
  netFee?: string;
  amountSent?: string;
  bridgeFee?: string;
  gasFee?: string;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const canExpand =
    isDefined(netFee) && (isDefined(bridgeFee) || isDefined(gasFee));

  return (
    <>
      {isDefined(amountSent) && (
        <Row>
          <Text color="grey-400">Amount sent</Text>
          <Text color="grey-400">${formatUSD(amountSent)}</Text>
        </Row>
      )}
      {isDefined(netFee) && (
        <ClickableRow onClick={() => canExpand && setIsExpanded(!isExpanded)}>
          <Text color="grey-400">Net fee</Text>
          <ChevronIconWrapper>
            {canExpand && <ChevronIconStyled isExpanded={isExpanded} />}
            <Text color="grey-400">${formatUSD(netFee)}</Text>
          </ChevronIconWrapper>
        </ClickableRow>
      )}
      {isExpanded && isDefined(bridgeFee) && (
        <Row>
          <Text color="grey-400">Bridge fee</Text>
          <Text color="grey-400">${formatUSD(bridgeFee)}</Text>
        </Row>
      )}
      {isExpanded && isDefined(gasFee) && (
        <Row>
          <Text color="grey-400">Gas fee</Text>
          <Text color="grey-400">${formatUSD(gasFee)}</Text>
        </Row>
      )}
    </>
  );
};

function CheckIconExplorerLink({
  txHash,
  chainId,
}: {
  txHash?: string;
  chainId: number;
}) {
  const chainInfo = getChainInfo(chainId);

  if (!txHash) {
    return <CheckIcon />;
  }

  return (
    <a
      href={chainInfo.constructExplorerLink(txHash)}
      target="_blank"
      rel="noreferrer"
    >
      <CheckIcon />
    </a>
  );
}

const Row = styled.div`
  display: flex;
  width: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: ${COLORS["grey-400-5"]};
`;

const DateWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const TransactionsPageLinkWrapper = styled.a`
  display: flex;
  flex-direction: row;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  text-decoration: none;
`;

const RotationKeyframes = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const StyledLoadingIcon = styled(LoadingIcon)`
  animation: ${RotationKeyframes} 2.5s linear infinite;
`;

const TryAgainButton = styled(Link)`
  display: flex;
  flex-direction: row;
  padding: 6px 12px;
  align-items: center;
  gap: 4px;

  border-radius: 22px;
  border: 1px solid var(--Color-Interface-yellow-15, rgba(249, 210, 108, 0.15));
  background: var(--Color-Interface-yellow-5, rgba(249, 210, 108, 0.05));

  &:hover {
    opacity: 0.75;
  }

  text-decoration: none;
`;

const CardWrapper = styled.div`
  display: flex;
  padding: 16px;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  align-self: stretch;

  border-radius: 16px;
  border: 1px solid ${COLORS["grey-600"]};
  background: ${COLORS["black-800"]};
  box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(12px);
`;

const ChevronIconWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const ChevronIconStyled = styled(ChevronIcon)`
  transform: rotate(
    ${({ isExpanded }: { isExpanded: boolean }) =>
      isExpanded ? "180deg" : "0deg"}
  );
  transition: transform 0.2s ease-in-out;
`;

const ClickableRow = styled(Row)`
  cursor: pointer;
`;
