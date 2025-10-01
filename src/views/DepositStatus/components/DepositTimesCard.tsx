import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
import { DateTime } from "luxon";
import { Link } from "react-router-dom";

import { ReactComponent as CheckIcon } from "assets/icons/check.svg";
import { ReactComponent as LoadingIcon } from "assets/icons/loading.svg";
import { ReactComponent as ExternalLinkIcon } from "assets/icons/arrow-up-right.svg";
import { ReactComponent as RefreshIcon } from "assets/icons/refresh.svg";

import { Text } from "components";
import {
  getChainInfo,
  COLORS,
  getBridgeUrlWithQueryParams,
  isDefined,
  formatUSD,
  getToken,
  getTokenForChain,
} from "utils";
import { useAmplitude } from "hooks";
import { ampli } from "ampli";

import { ElapsedTime } from "./ElapsedTime";
import { DepositStatus } from "../types";
import TokenFee from "views/Bridge/components/TokenFee";
import { BigNumber } from "ethers";
import { useResolveFromBridgePagePayload } from "../hooks/useResolveFromBridgePagePayload";
import { FromBridgePagePayload } from "views/Bridge/hooks/useBridgeAction";
import {
  calcFeesForEstimatedTable,
  getTokensForFeesCalc,
} from "views/Bridge/utils";
import { useTokenConversion } from "hooks/useTokenConversion";
import EstimatedTable from "views/Bridge/components/EstimatedTable";

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
  fromBridgePagePayload?: FromBridgePagePayload;
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
  fromBridgePagePayload,
}: Props) {
  const { estimatedRewards, amountAsBaseCurrency, isSwap, isUniversalSwap } =
    useResolveFromBridgePagePayload(
      fromChainId,
      toChainId,
      inputTokenSymbol,
      outputTokenSymbol || inputTokenSymbol,
      fromBridgePagePayload
    );

  const netFee = estimatedRewards?.netFeeAsBaseCurrency?.toString();
  const amountSentBaseCurrency = amountAsBaseCurrency?.toString();

  const { inputToken, bridgeToken, outputToken } = getTokensForFeesCalc({
    inputToken: getToken(inputTokenSymbol),
    outputToken: getToken(outputTokenSymbol || inputTokenSymbol),
    isUniversalSwap: isUniversalSwap,
    universalSwapQuote: fromBridgePagePayload?.universalSwapQuote,
    fromChainId: fromChainId,
    toChainId: toChainId,
  });

  const { convertTokenToBaseCurrency: convertInputTokenToUsd } =
    useTokenConversion(inputToken.symbol, "usd");
  const { convertTokenToBaseCurrency: convertBridgeTokenToUsd } =
    useTokenConversion(bridgeToken.symbol, "usd");
  const {
    convertTokenToBaseCurrency: convertOutputTokenToUsd,
    convertBaseCurrencyToToken: convertUsdToOutputToken,
  } = useTokenConversion(outputToken.symbol || inputTokenSymbol, "usd");

  const { outputAmountUsd } =
    calcFeesForEstimatedTable({
      gasFee: fromBridgePagePayload?.quote?.relayerGasFee?.total,
      capitalFee: fromBridgePagePayload?.quote?.relayerCapitalFee?.total,
      lpFee: fromBridgePagePayload?.quote?.lpFee?.total,
      isSwap,
      isUniversalSwap,
      swapQuote: fromBridgePagePayload?.swapQuote,
      universalSwapQuote: fromBridgePagePayload?.universalSwapQuote,
      parsedAmount:
        fromBridgePagePayload?.depositArgs?.initialAmount || BigNumber.from(0),
      convertInputTokenToUsd,
      convertBridgeTokenToUsd,
      convertOutputTokenToUsd,
    }) || {};
  const outputAmount = convertUsdToOutputToken(outputAmountUsd);

  const isDepositing = status === "depositing";
  const isFilled = status === "filled";
  const isDepositReverted = status === "deposit-reverted";
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
      {(netFee || amountSentBaseCurrency) && <Divider />}
      {isDefined(outputAmount) &&
        isDefined(outputTokenSymbol) &&
        isDefined(amountSentBaseCurrency) && (
          <Row>
            <Text color="grey-400">Amount sent</Text>
            <TokenWrapper>
              <TokenFee
                token={getTokenForChain(outputTokenSymbol, toChainId)}
                amount={BigNumber.from(outputAmount)}
                tokenChainId={toChainId}
                tokenFirst
                showTokenLinkOnHover
                textColor="light-100"
              />
              <Text color="grey-400">
                (${formatUSD(amountSentBaseCurrency)})
              </Text>
            </TokenWrapper>
          </Row>
        )}
      {isDefined(outputTokenSymbol) && (
        <EstimatedTable
          {...estimatedRewards}
          isQuoteLoading={false}
          fromChainId={fromChainId}
          toChainId={toChainId}
          inputToken={inputToken}
          outputToken={getTokenForChain(outputTokenSymbol, toChainId)}
          isSwap={isSwap}
          isUniversalSwap={isUniversalSwap}
          swapQuote={fromBridgePagePayload?.swapQuote}
          universalSwapQuote={fromBridgePagePayload?.universalSwapQuote}
          omitDivider
          collapsible
          onSetNewSlippage={undefined}
        />
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

  const explorerUrl = chainInfo.intermediaryChain
    ? getChainInfo(chainInfo.intermediaryChain).constructExplorerLink(txHash)
    : chainInfo.constructExplorerLink(txHash);

  return (
    <a href={explorerUrl} target="_blank" rel="noreferrer">
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

const TokenWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;
