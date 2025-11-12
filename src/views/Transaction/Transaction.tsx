import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { COLORS, getChainInfo, getConfig, QUERIESV2 } from "utils";
import { Text } from "components/Text";
import { LayoutV2 } from "components";
import { ReactComponent as ArrowIcon } from "assets/icons/chevron-down.svg";
import { ReactComponent as BackgroundGraphic } from "assets/bg-banners/overview-card-background.svg";
import SectionWrapper from "components/SectionTitleWrapperV2/SectionWrapperV2";
import { useDepositByTxHash } from "hooks/useDepositStatus";
import { CenteredMessage } from "./components/CenteredMessage";
import { DetailSection } from "./components/DetailSection";
import { StatusBadge } from "./components/StatusBadge";
import { IconPairDisplay } from "./components/IconPairDisplay";
import { TxDetailSection } from "./components/TxDetailSection";
import { CopyableText } from "./components/CopyableText";
import { QuickLinksBar } from "./components/QuickLinksBar";
import { CollapsibleSection } from "./components/CollapsibleSection";
import { formatUnitsWithMaxFractions, shortenAddress } from "utils/format";
import DepositStatusAnimatedIcons from "../DepositStatus/components/DepositStatusAnimatedIcons";

const LOADING_DELAY_MS = 400;

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

function calculateFillDuration(
  depositTimestamp: string | null,
  fillTimestamp: string | null
): { formatted: string; isPending: boolean } {
  if (!depositTimestamp) {
    return { formatted: "N/A", isPending: false };
  }

  const depositTime = new Date(depositTimestamp).getTime();

  if (!fillTimestamp) {
    const elapsedMs = Date.now() - depositTime;
    const elapsedSeconds = elapsedMs / 1000;

    if (elapsedSeconds < 60) {
      return {
        formatted: `${elapsedSeconds.toFixed(1)}s elapsed`,
        isPending: true,
      };
    } else if (elapsedSeconds < 3600) {
      const minutes = Math.floor(elapsedSeconds / 60);
      return {
        formatted: `${minutes}m ${Math.floor(elapsedSeconds % 60)}s elapsed`,
        isPending: true,
      };
    } else {
      const hours = Math.floor(elapsedSeconds / 3600);
      const minutes = Math.floor((elapsedSeconds % 3600) / 60);
      return {
        formatted: `${hours}h ${minutes}m elapsed`,
        isPending: true,
      };
    }
  }

  const fillTime = new Date(fillTimestamp).getTime();
  const durationMs = fillTime - depositTime;

  if (durationMs < 1000) {
    return { formatted: `${durationMs}ms`, isPending: false };
  } else if (durationMs < 60000) {
    return {
      formatted: `${(durationMs / 1000).toFixed(3)}s`,
      isPending: false,
    };
  } else {
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return {
      formatted: `${minutes}m ${remainingSeconds}s`,
      isPending: false,
    };
  }
}

export default function Transaction() {
  const { depositTxnRef } = useParams<{ depositTxnRef: string }>();
  const {
    data: depositData,
    isLoading,
    error,
  } = useDepositByTxHash(depositTxnRef);

  const [showLoading, setShowLoading] = useState(false);

  // Delay showing loading state to avoid flash for fast loads
  useEffect(() => {
    if (!isLoading) {
      setShowLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowLoading(true);
    }, LOADING_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isLoading]);

  if (showLoading) return <CenteredMessage title="Loading transaction..." />;
  if (error)
    return (
      <CenteredMessage
        title="Error loading transaction"
        error={String(error)}
      />
    );
  if (!depositData) {
    // If we have no data and not loading, it means the transaction wasn't found
    if (!isLoading) {
      return <CenteredMessage title="Transaction not found" />;
    }
    // Still loading but within the delay period, show nothing yet
    return null;
  }

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

  const fillDuration = calculateFillDuration(
    deposit.depositBlockTimestamp,
    deposit.fillBlockTimestamp
  );

  const quickLinks = [
    {
      label: "View Deposit",
      url: sourceChain.constructExplorerLink(deposit.depositTxnRef),
      chainName: sourceChain.name,
    },
  ];

  if (deposit.fillTx) {
    quickLinks.push({
      label: "View Fill",
      url: destinationChain.constructExplorerLink(deposit.fillTx),
      chainName: destinationChain.name,
    });
  }

  return (
    <LayoutV2 maxWidth={1140}>
      <Wrapper>
        <BreadcrumbWrapper>
          <BreadcrumbContent>
            <BreadcrumbLink to="/transactions">
              <BreadcrumbLinkText size="lg">Transactions</BreadcrumbLinkText>
            </BreadcrumbLink>
            <StyledArrowIcon />
            <CurrentPageText size="lg">Transaction Details</CurrentPageText>
          </BreadcrumbContent>
          <BreadcrumbDivider />
        </BreadcrumbWrapper>
        <InnerSectionWrapper>
          <FillTimeHero>
            <StatusWrapper>
              <DepositStatusAnimatedIcons
                status={deposit.status as any}
                toChainId={Number(destinationChainId)}
                fromChainId={Number(deposit.originChainId)}
                externalProjectId={undefined}
              />
            </StatusWrapper>

            <BackgroundWrapper>
              <BackgroundGraphic />
            </BackgroundWrapper>
            <HeroContent>
              <FillTimeLabel>
                {fillDuration.isPending ? "Time Elapsed" : "Fill Time"}
              </FillTimeLabel>
              <FillTimeDuration isPending={fillDuration.isPending}>
                {fillDuration.formatted}
              </FillTimeDuration>
              <StatusBadge status={deposit.status} />
            </HeroContent>
          </FillTimeHero>

          <QuickLinksBar links={quickLinks} />

          <SectionWrapper title="Basic Information">
            <DetailsGrid>
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
            </DetailsGrid>
          </SectionWrapper>

          <SectionWrapper title="Amounts">
            <DetailsGrid>
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
            </DetailsGrid>
          </SectionWrapper>

          <SectionWrapper title="Fees">
            <DetailsGrid>
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
            </DetailsGrid>
          </SectionWrapper>

          <SectionWrapper title="Addresses">
            <DetailsGrid>
              <DetailSection label="Depositor">
                <CopyableText
                  color="light-200"
                  textToCopy={deposit.depositor}
                  explorerLink={`${sourceChain.explorerUrl}/address/${deposit.depositor}`}
                >
                  {shortenAddress(deposit.depositor, "...", 6)}
                </CopyableText>
              </DetailSection>

              <DetailSection label="Recipient">
                <CopyableText
                  color="light-200"
                  textToCopy={deposit.recipient}
                  explorerLink={`${destinationChain.explorerUrl}/address/${deposit.recipient}`}
                >
                  {shortenAddress(deposit.recipient, "...", 6)}
                </CopyableText>
              </DetailSection>

              <DetailSection label="Relayer">
                {deposit.relayer ? (
                  <CopyableText
                    color="light-200"
                    textToCopy={deposit.relayer}
                    explorerLink={`${destinationChain.explorerUrl}/address/${deposit.relayer}`}
                  >
                    {shortenAddress(deposit.relayer, "...", 6)}
                  </CopyableText>
                ) : (
                  <Text color="light-200">N/A</Text>
                )}
              </DetailSection>

              {deposit.exclusiveRelayer &&
                deposit.exclusiveRelayer !==
                  "0x0000000000000000000000000000000000000000" && (
                  <DetailSection label="Exclusive Relayer">
                    <CopyableText
                      color="light-200"
                      textToCopy={deposit.exclusiveRelayer}
                      explorerLink={`${destinationChain.explorerUrl}/address/${deposit.exclusiveRelayer}`}
                    >
                      {shortenAddress(deposit.exclusiveRelayer, "...", 6)}
                    </CopyableText>
                  </DetailSection>
                )}
            </DetailsGrid>
          </SectionWrapper>

          <SectionWrapper title="Recent Activity">
            <DetailsGrid>
              <DetailSection label="Deposit Time">
                <Text color="light-200">
                  {formatTimestamp(deposit.depositBlockTimestamp)}
                </Text>
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
            </DetailsGrid>
          </SectionWrapper>

          <SectionWrapper title="Transactions">
            <DetailsGrid>
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
            </DetailsGrid>
          </SectionWrapper>

          <CollapsibleSection title="Advanced Details" defaultOpen={false}>
            <DetailsGrid>
              <DetailSection label="Deposit Block">
                <Text color="light-200">{deposit.depositBlockNumber}</Text>
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

              <DetailSection label="Relay Hash">
                <CopyableText
                  color="light-200"
                  textToCopy={deposit.relayHash}
                  style={{ wordBreak: "break-all" }}
                >
                  {deposit.relayHash}
                </CopyableText>
              </DetailSection>

              <DetailSection label="Message Hash">
                <CopyableText
                  color="light-200"
                  textToCopy={deposit.messageHash}
                  style={{ wordBreak: "break-all" }}
                >
                  {deposit.messageHash}
                </CopyableText>
              </DetailSection>

              {deposit.message && deposit.message !== "0x" && (
                <DetailSection label="Message">
                  <CopyableText
                    color="light-200"
                    textToCopy={deposit.message}
                    style={{ wordBreak: "break-all" }}
                  >
                    {deposit.message}
                  </CopyableText>
                </DetailSection>
              )}

              {deposit.actionsTargetChainId && (
                <>
                  <DetailSection label="Actions Target Chain">
                    <Text color="light-200">
                      {
                        getChainInfo(parseInt(deposit.actionsTargetChainId))
                          .name
                      }
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
                    <CopyableText
                      color="light-200"
                      textToCopy={deposit.swapToken}
                      explorerLink={`${destinationChain.explorerUrl}/address/${deposit.swapToken}`}
                    >
                      {shortenAddress(deposit.swapToken, "...", 6)}
                    </CopyableText>
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
          </CollapsibleSection>
        </InnerSectionWrapper>
      </Wrapper>
    </LayoutV2>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;

  max-width: 1140px;
  width: 100%;

  margin: 0 auto;
  padding: 32px 0;

  @media ${QUERIESV2.sm.andDown} {
    padding: 16px 0;
    gap: 16px;
  }
`;

const InnerSectionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 64px;

  width: 100%;

  @media ${QUERIESV2.sm.andDown} {
    gap: 24px;
  }
`;

const StatusWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;

  @media ${QUERIESV2.sm.andDown} {
    margin-bottom: -8px;
  }
`;

const BreadcrumbWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 12px;
  width: 100%;
`;

const BreadcrumbDivider = styled.div`
  background: #34353b;
  height: 1px;
  width: 100%;
`;

const BreadcrumbContent = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 8px;
`;

const BreadcrumbLink = styled(Link)`
  color: #9daab2;
  text-transform: capitalize;
  text-decoration: none;
`;

const BreadcrumbLinkText = styled(Text)`
  color: #9daab2;
  text-transform: capitalize;
`;

const CurrentPageText = styled(Text)`
  color: #e0f3ff;
  text-transform: capitalize;
`;

const StyledArrowIcon = styled(ArrowIcon)`
  rotate: -90deg;
`;

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  width: 100%;
  padding: 24px;
  background: ${COLORS["grey-600"]};
  border-radius: 12px;
  border: 1px solid ${COLORS["grey-500"]};

  @media ${QUERIESV2.sm.andDown} {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 16px;
  }
`;

const FillTimeHero = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 40px 24px;
  background: ${COLORS["black-700"]};
  border-radius: 16px;
  border: 1px solid ${COLORS["grey-600"]};
  overflow: clip;
  isolation: isolate;

  @media ${QUERIESV2.sm.andDown} {
    padding: 32px 16px;
    gap: 12px;
  }
`;

const BackgroundWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  z-index: 0;

  svg {
    width: 100%;
    height: 100%;
  }
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;

  @media ${QUERIESV2.sm.andDown} {
    gap: 12px;
  }
`;

const FillTimeLabel = styled(Text)`
  font-size: 14px;
  font-weight: 500;
  color: ${COLORS["grey-400"]};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const FillTimeDuration = styled.div<{ isPending?: boolean }>`
  font-size: 56px;
  font-weight: 700;
  line-height: 1.2;
  color: ${(props) => (props.isPending ? COLORS.yellow : COLORS.aqua)};
  font-variant-numeric: tabular-nums;
  text-shadow: 0px 2px 8px rgba(0, 0, 0, 0.2);

  @media ${QUERIESV2.sm.andDown} {
    font-size: 40px;
  }
`;
