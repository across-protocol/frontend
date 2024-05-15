import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
import { DateTime } from "luxon";
import { Link } from "react-router-dom";

import { ReactComponent as CheckIcon } from "assets/check.svg";
import { ReactComponent as LoadingIcon } from "assets/loading.svg";
import { ReactComponent as ExternalLinkIcon } from "assets/icons/external-link-16.svg";
import { ReactComponent as RefreshIcon } from "assets/icons/refresh.svg";

import { Text, CardWrapper } from "components";
import { getChainInfo, COLORS } from "utils";
import { useAmplitude } from "hooks";
import { ampli } from "ampli";

import { ElapsedTime } from "./ElapsedTime";
import { DepositStatus } from "../types";

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
}: Props) {
  const isDepositing = status === "depositing";
  const isFilled = status === "filled";
  const isDepositReverted = status === "deposit-reverted";

  const { addToAmpliQueue } = useAmplitude();

  const cleanParams = Object.entries({
    from: fromChainId.toString(),
    to: toChainId.toString(),
    inputToken: inputTokenSymbol,
    outputToken: outputTokenSymbol,
  }).reduce((acc, [key, value]) => {
    if (value) {
      return { ...acc, [key]: value };
    }
    return acc;
  }, {});
  const tryAgainLink = "/bridge?" + new URLSearchParams(cleanParams).toString();

  return (
    <CardWrapper>
      <Row>
        <Text>Deposit time</Text>
        {isDepositing ? (
          <ElapsedTime
            elapsedSeconds={depositTxElapsedSeconds}
            isCompleted={false}
            StatusIcon={<StyledLoadingIcon />}
          />
        ) : isDepositReverted ? (
          <TryAgainButton to={tryAgainLink}>
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
        <Text>Fill time</Text>
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
      <Divider />
      <Row>
        <Text>Total time</Text>
        {!isFilled ? (
          <Text>-</Text>
        ) : (
          <ElapsedTime
            elapsedSeconds={
              (depositTxElapsedSeconds || 0) + (fillTxElapsedSeconds || 0)
            }
            isCompleted
            StatusIcon={<CheckIcon />}
          />
        )}
      </Row>
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
        <Text>
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
  background: ${COLORS["grey-600"]};
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
  border: 1px solid ${COLORS["grey-500"]};
  border-radius: 8px;
  padding: 16px;
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
