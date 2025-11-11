import { useHistory, useParams } from "react-router-dom";
import styled from "@emotion/styled";
import { COLORS, getChainInfo, getConfig, QUERIESV2 } from "utils";
import { Text } from "components/Text";
import { useDepositByTxHash } from "hooks/useDepositStatus";
import { CenteredMessage } from "./components/CenteredMessage";
import { DetailSection } from "./components/DetailSection";
import { StatusBadge } from "./components/StatusBadge";
import { IconPairDisplay } from "./components/IconPairDisplay";
import { TxDetailSection } from "./components/TxDetailSection";
import { formatUnitsWithMaxFractions, shortenAddress } from "utils/format";
import { DepositStatusUpperCard } from "../DepositStatus/components/DepositStatusUpperCard";

// Helper function to format USD string values
function formatUSDValue(value: string | null): string {
  if (!value || value === "0") return "$0.00";
  const num = parseFloat(value);
  if (isNaN(num)) return "$0.00";
  return `$${num.toFixed(2)}`;
}

// Helper function to format timestamps
function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) return "N/A";
  try {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "Invalid date";
  }
}

export default function Transaction() {
  const { depositTxnRef } = useParams<{ depositTxnRef: string }>();
  const {
    data: depositData,
    isLoading,
    error,
  } = useDepositByTxHash(depositTxnRef);

  const history = useHistory();

  if (isLoading) return <CenteredMessage title="Loading transaction..." />;
  if (error)
    return (
      <CenteredMessage
        title="Error loading transaction"
        error={String(error)}
      />
    );
  if (!depositData) return <CenteredMessage title="Transaction not found" />;

  const deposit = depositData.deposit;
  const config = getConfig();

  const sourceChainId = parseInt(deposit.originChainId);
  const destinationChainId = parseInt(deposit.destinationChainId);
  const sourceChain = getChainInfo(sourceChainId);
  const destinationChain = getChainInfo(destinationChainId);

  const inputToken = config.getTokenInfoByAddressSafe(
    sourceChainId,
    deposit.inputToken
  );
  const outputToken = config.getTokenInfoByAddressSafe(
    destinationChainId,
    deposit.outputToken
  );

  return (
    <Wrapper>
      <Container>
        <Header>
          <BackButton onClick={() => history.goBack()}>← Back</BackButton>
          <Title>Transaction Details</Title>
        </Header>
        <DepositStatusUpperCard
          depositTxHash={deposit.depositTxHash}
          fromChainId={Number(deposit.originChainId)}
          toChainId={Number(destinationChainId)}
          inputTokenSymbol={inputToken!.symbol}
          outputTokenSymbol={outputToken?.symbol || inputToken!.symbol}
          fromBridgePagePayload={undefined}
          externalProjectId={undefined}
        />

        <DetailsGrid>
          {/* Basic Information Section */}
          <SectionTitle>Basic Information</SectionTitle>

          <DetailSection label="Status">
            <StatusBadge status={deposit.status} />
          </DetailSection>

          {inputToken && outputToken && (
            <DetailSection label="Asset">
              <IconPairDisplay
                leftIcon={inputToken.logoURI}
                leftAlt={inputToken.symbol}
                rightIcon={outputToken.logoURI}
                rightAlt={outputToken.symbol}
                label={`${inputToken.symbol} → ${outputToken.symbol}`}
              />
            </DetailSection>
          )}

          <DetailSection label="Route">
            <IconPairDisplay
              leftIcon={sourceChain.logoURI}
              leftAlt={sourceChain.name}
              rightIcon={destinationChain.logoURI}
              rightAlt={destinationChain.name}
              label={`${sourceChain.name} → ${destinationChain.name}`}
            />
          </DetailSection>

          <DetailSection label="Deposit ID">
            <Text color="light-200">{deposit.depositId}</Text>
          </DetailSection>

          {/* Amounts Section */}
          <SectionTitle>Amounts</SectionTitle>

          <DetailSection label="Input Amount">
            <Text color="light-200">
              {inputToken
                ? formatUnitsWithMaxFractions(
                    deposit.inputAmount,
                    inputToken.decimals
                  )
                : deposit.inputAmount}{" "}
              {inputToken?.symbol}
              <Text color="grey-400" size="sm">
                {" "}
                ({formatUSDValue(deposit.inputPriceUsd)})
              </Text>
            </Text>
          </DetailSection>

          <DetailSection label="Output Amount">
            <Text color="light-200">
              {outputToken
                ? formatUnitsWithMaxFractions(
                    deposit.outputAmount,
                    outputToken.decimals
                  )
                : deposit.outputAmount}{" "}
              {outputToken?.symbol}
              <Text color="grey-400" size="sm">
                {" "}
                ({formatUSDValue(deposit.outputPriceUsd)})
              </Text>
            </Text>
          </DetailSection>

          {/* Fees Section */}
          <SectionTitle>Fees</SectionTitle>

          <DetailSection label="Bridge Fee">
            <Text color="light-200">
              {formatUSDValue(deposit.bridgeFeeUsd)}
            </Text>
          </DetailSection>

          <DetailSection label="Fill Gas Fee">
            <Text color="light-200">
              {deposit.fillGasFee}{" "}
              <Text color="grey-400" size="sm">
                ({formatUSDValue(deposit.fillGasFeeUsd)})
              </Text>
            </Text>
          </DetailSection>

          {deposit.swapFeeUsd && (
            <DetailSection label="Swap Fee">
              <Text color="light-200">
                {formatUSDValue(deposit.swapFeeUsd)}
              </Text>
            </DetailSection>
          )}

          {/* Addresses Section */}
          <SectionTitle>Addresses</SectionTitle>

          <DetailSection label="Depositor">
            <Text color="light-200">
              {shortenAddress(deposit.depositor, "...", 6)}
            </Text>
          </DetailSection>

          <DetailSection label="Recipient">
            <Text color="light-200">
              {shortenAddress(deposit.recipient, "...", 6)}
            </Text>
          </DetailSection>

          <DetailSection label="Relayer">
            <Text color="light-200">
              {deposit.relayer
                ? shortenAddress(deposit.relayer, "...", 6)
                : "N/A"}
            </Text>
          </DetailSection>

          {deposit.exclusiveRelayer &&
            deposit.exclusiveRelayer !==
              "0x0000000000000000000000000000000000000000" && (
              <DetailSection label="Exclusive Relayer">
                <Text color="light-200">
                  {shortenAddress(deposit.exclusiveRelayer, "...", 6)}
                </Text>
              </DetailSection>
            )}

          {/* Timestamps Section */}
          <SectionTitle>Timestamps & Deadlines</SectionTitle>

          <DetailSection label="Deposit Time">
            <Text color="light-200">
              {formatTimestamp(deposit.depositBlockTimestamp)}
            </Text>
          </DetailSection>

          <DetailSection label="Deposit Block">
            <Text color="light-200">{deposit.depositBlockNumber}</Text>
          </DetailSection>

          {deposit.fillBlockTimestamp && (
            <DetailSection label="Fill Time">
              <Text color="light-200">
                {formatTimestamp(deposit.fillBlockTimestamp)}
              </Text>
            </DetailSection>
          )}

          <DetailSection label="Quote Time">
            <Text color="light-200">
              {formatTimestamp(deposit.quoteTimestamp)}
            </Text>
          </DetailSection>

          <DetailSection label="Fill Deadline">
            <Text color="light-200">
              {formatTimestamp(deposit.fillDeadline)}
            </Text>
          </DetailSection>

          {deposit.exclusivityDeadline && (
            <DetailSection label="Exclusivity Deadline">
              <Text color="light-200">
                {formatTimestamp(deposit.exclusivityDeadline)}
              </Text>
            </DetailSection>
          )}

          {/* Transactions Section */}
          <SectionTitle>Transactions</SectionTitle>

          <TxDetailSection
            label="Deposit Transaction"
            txHash={deposit.depositTxnRef}
            explorerLink={sourceChain.constructExplorerLink(
              deposit.depositTxnRef
            )}
          />

          {deposit.fillTx && (
            <TxDetailSection
              label="Fill Transaction"
              txHash={deposit.fillTx}
              explorerLink={destinationChain.constructExplorerLink(
                deposit.fillTx
              )}
            />
          )}

          {deposit.depositRefundTxnRef && (
            <TxDetailSection
              label="Refund Transaction"
              txHash={deposit.depositRefundTxnRef}
              explorerLink={sourceChain.constructExplorerLink(
                deposit.depositRefundTxnRef
              )}
            />
          )}

          {deposit.swapTransactionHash && (
            <TxDetailSection
              label="Swap Transaction"
              txHash={deposit.swapTransactionHash}
              explorerLink={
                deposit.actionsTargetChainId
                  ? getChainInfo(
                      parseInt(deposit.actionsTargetChainId)
                    ).constructExplorerLink(deposit.swapTransactionHash)
                  : "#"
              }
            />
          )}

          {/* Advanced Details Section */}
          <SectionTitle>Advanced Details</SectionTitle>

          <DetailSection label="Relay Hash">
            <Text color="light-200" style={{ wordBreak: "break-all" }}>
              {deposit.relayHash}
            </Text>
          </DetailSection>

          <DetailSection label="Message Hash">
            <Text color="light-200" style={{ wordBreak: "break-all" }}>
              {deposit.messageHash}
            </Text>
          </DetailSection>

          {deposit.message && deposit.message !== "0x" && (
            <DetailSection label="Message">
              <Text color="light-200" style={{ wordBreak: "break-all" }}>
                {deposit.message}
              </Text>
            </DetailSection>
          )}

          {deposit.actionsTargetChainId && (
            <>
              <DetailSection label="Actions Target Chain">
                <Text color="light-200">
                  {getChainInfo(parseInt(deposit.actionsTargetChainId)).name}
                </Text>
              </DetailSection>

              <DetailSection label="Actions Succeeded">
                <Text color="light-200">
                  {deposit.actionsSucceeded === null
                    ? "Pending"
                    : deposit.actionsSucceeded
                      ? "Yes"
                      : "No"}
                </Text>
              </DetailSection>
            </>
          )}

          {deposit.swapToken && (
            <>
              <DetailSection label="Swap Token">
                <Text color="light-200">
                  {shortenAddress(deposit.swapToken, "...", 6)}
                </Text>
              </DetailSection>

              {deposit.swapTokenAmount && (
                <DetailSection label="Swap Token Amount">
                  <Text color="light-200">
                    {deposit.swapTokenAmount}{" "}
                    <Text color="grey-400" size="sm">
                      ({formatUSDValue(deposit.swapTokenPriceUsd)})
                    </Text>
                  </Text>
                </DetailSection>
              )}
            </>
          )}

          {deposit.fillGasTokenPriceUsd && (
            <DetailSection label="Gas Token Price (USD)">
              <Text color="light-200">
                {formatUSDValue(deposit.fillGasTokenPriceUsd)}
              </Text>
            </DetailSection>
          )}
        </DetailsGrid>
      </Container>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 40px 20px;
  min-height: calc(100vh - 200px);
  background: ${COLORS["black-900"]};

  @media ${QUERIESV2.sm.andDown} {
    padding: 20px 12px;
  }
`;

const Container = styled.div`
  max-width: 900px;
  width: 100%;
  background: ${COLORS["grey-600"]};
  border-radius: 12px;
  padding: 32px;
  border: 1px solid ${COLORS["grey-500"]};

  @media ${QUERIESV2.sm.andDown} {
    padding: 20px;
  }
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: ${COLORS["grey-400"]};
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  margin-bottom: 16px;
  transition: color 0.2s;

  &:hover {
    color: ${COLORS["light-200"]};
  }
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: ${COLORS.white};
  margin: 0;

  @media ${QUERIESV2.sm.andDown} {
    font-size: 24px;
  }
`;

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;

  @media ${QUERIESV2.sm.andDown} {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const SectionTitle = styled.h2`
  grid-column: 1 / -1;
  font-size: 18px;
  font-weight: 600;
  color: ${COLORS.white};
  margin: 16px 0 0 0;
  padding-top: 16px;
  border-top: 1px solid ${COLORS["grey-500"]};

  &:first-of-type {
    margin-top: 0;
    padding-top: 0;
    border-top: none;
  }

  @media ${QUERIESV2.sm.andDown} {
    font-size: 16px;
  }
`;
