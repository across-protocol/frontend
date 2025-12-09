"use client";
import React, { ButtonHTMLAttributes, useEffect } from "react";
import { ReactComponent as Info } from "assets/icons/info.svg";
import { ReactComponent as Route } from "assets/icons/route.svg";
import { ReactComponent as Dollar } from "assets/icons/dollar.svg";
import { ReactComponent as Time } from "assets/icons/time.svg";
import { ReactComponent as Warning } from "assets/icons/warning_triangle_filled.svg";
import { COLORS, isDefined } from "utils";
import styled from "@emotion/styled";
import { Tooltip } from "components/Tooltip";
import { SwapApprovalApiCallReturnType } from "utils/serverless-api/prod/swap-approval";
import { getPriceImpact, getSwapQuoteFees } from "../../utils/fees";
import { ProviderBadge } from "./BridgeProvider";
import { useQuoteRequestContext } from "../../hooks/useQuoteRequest/QuoteRequestContext";
import { useButtonState } from "../../hooks/useButtonState";
import { useSwapApprovalAction } from "../../hooks/useSwapApprovalAction";
import { useOnConfirm } from "../../hooks/useOnConfirm";
import { useValidateSwapAndBridge } from "../../hooks/useValidateSwapAndBridge";
import { useEcosystemAccounts } from "../../../../hooks/useEcosystemAccounts";
import { ExpandableLabelSection } from "./ExpandableLabelSection";
import { CoreConfirmationButton } from "./CoreConfirmationButton";
import {
  getProviderFromQuote,
  isBridgeProviderSponsored,
} from "../../utils/bridgeProvider";

export type BridgeButtonState =
  | "notConnected"
  | "readyToConfirm"
  | "submitting"
  | "wrongNetwork"
  | "loadingQuote"
  | "validationError"
  | "apiError";

interface ConfirmationButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  swapQuote: SwapApprovalApiCallReturnType | undefined;
  isQuoteLoading: boolean;
  quoteError: Error | null;
  onConfirm?: () => Promise<void>;
  initialExpanded?: boolean;
}

export const ConfirmationButton: React.FC<ConfirmationButtonProps> = ({
  swapQuote,
  isQuoteLoading,
  quoteError,
  initialExpanded = false,
}) => {
  const { quoteRequest } = useQuoteRequestContext();

  const { depositor } = useEcosystemAccounts({
    originToken: quoteRequest.originToken,
    destinationToken: quoteRequest.destinationToken,
    customDestinationAccount: quoteRequest.customDestinationAccount,
  });

  const approvalAction = useSwapApprovalAction(
    quoteRequest.originToken?.chainId || 0,
    swapQuote
  );

  const onConfirm = useOnConfirm(quoteRequest, approvalAction);

  const validation = useValidateSwapAndBridge(
    quoteRequest.amount,
    quoteRequest.tradeType === "exactInput",
    quoteRequest.originToken,
    quoteRequest.destinationToken,
    !!depositor,
    swapQuote?.inputAmount
  );

  const buttonState = useButtonState(
    quoteRequest,
    approvalAction,
    validation,
    quoteError,
    isQuoteLoading
  );

  const { originToken, destinationToken, amount } = quoteRequest;
  const { buttonStatus, buttonLoading, buttonLabel, buttonDisabled } =
    buttonState;
  // Render unified group driven by state
  const priceImpact = getPriceImpact(swapQuote);
  const [expanded, setExpanded] = React.useState(initialExpanded);

  // Calculate display values from swapQuote
  // Resolve conversion helpers outside memo to respect hooks rules

  const displayValues = React.useMemo(() => {
    if (!swapQuote || !originToken || !destinationToken || !swapQuote.fees) {
      return {
        fee: "-",
        time: "-",
        bridgeFee: "-",
        appFee: undefined,
        swapImpact: undefined,
        route: "Across V4",
        estimatedTime: "-",
        totalFee: "-",
      };
    }

    const {
      totalFeeFormatted,
      bridgeFeeFormatted,
      swapImpactFormatted,
      swapImpactUsd,
    } = getSwapQuoteFees(swapQuote);

    const totalSeconds = Math.max(0, Number(swapQuote.expectedFillTime || 0));
    const underOneMinute = totalSeconds < 60;
    const time = underOneMinute
      ? `~${Math.max(1, Math.round(totalSeconds))} secs`
      : `~${Math.ceil(totalSeconds / 60)} min`;

    // for sponsored bridges, always show this line item (as a flex), otherwise only show if a swap is involved
    const showSwapImpact =
      priceImpact?.priceImpact === 0 ? true : Number(swapImpactUsd) > 0;

    return {
      totalFee: totalFeeFormatted,
      time,
      bridgeFee: bridgeFeeFormatted,
      swapImpact: showSwapImpact ? swapImpactFormatted : undefined,
      estimatedTime: time,
    };
  }, [swapQuote, originToken, destinationToken, amount]);

  // When notConnected, make button clickable so it can open wallet modal
  const isButtonDisabled =
    buttonStatus === "notConnected" ? false : buttonDisabled;

  useEffect(() => {
    if (!swapQuote) {
      setExpanded(false);
    }
  }, [swapQuote]);

  const provider = getProviderFromQuote(swapQuote);
  const isSponsoredIntent = isBridgeProviderSponsored(provider);

  const content = (
    <>
      <ExpandableLabelSection
        fee={displayValues.totalFee}
        time={displayValues.time}
        expanded={expanded}
        onToggle={() => setExpanded((e) => !e)}
        visible={true}
        state={buttonStatus}
        hasQuote={!!swapQuote}
        priceImpact={priceImpact}
        provider={provider}
      >
        <ExpandedDetails>
          <DetailRow>
            <DetailLeft>
              <Route width="16px" height="16px" />
              <span>Route</span>
            </DetailLeft>
            <DetailRight>
              <ProviderBadge provider={provider} expanded></ProviderBadge>
            </DetailRight>
          </DetailRow>
          <DetailRow>
            <DetailLeft>
              <Time width="16px" height="16px" />
              <span>Est. Time</span>
            </DetailLeft>
            <DetailRight>{displayValues.estimatedTime}</DetailRight>
          </DetailRow>
          <DetailRow>
            <DetailLeft>
              <Dollar width="16px" height="16px" />
              <span>Total Fee</span>
              <Tooltip
                tooltipId="ConfirmationButton - total fee"
                body="Sum of bridge and swap fees"
              >
                <Info color="inherit" width="16px" height="16px" />
              </Tooltip>
            </DetailLeft>
            <DetailRight>
              {priceImpact?.tooHigh ? (
                <Tooltip
                  tooltipId="High fee warning"
                  body={
                    <WarningTooltipBody>
                      Warning: High price impact, you will receive{" "}
                      {priceImpact.priceImpactFormatted}% less than your input.
                    </WarningTooltipBody>
                  }
                >
                  <DetailRightRed>
                    <Warning width="16px" height="16px" color="inherit" />
                    {displayValues.totalFee} (-
                    {priceImpact.priceImpactFormatted}%)
                  </DetailRightRed>
                </Tooltip>
              ) : (
                <>
                  {isSponsoredIntent && <FreeTag>FREE</FreeTag>}{" "}
                  {displayValues.totalFee}
                </>
              )}
            </DetailRight>
          </DetailRow>
          <FeeBreakdown>
            <FeeBreakdownRow>
              <FeeBreakdownLabel>
                <span>Bridge Fee</span>
                <Tooltip
                  tooltipId="ConfirmationButton - bridge fee"
                  body="Includes destination gas, relayer fees, and LP fees"
                >
                  <Info color="inherit" width="16px" height="16px" />
                </Tooltip>
              </FeeBreakdownLabel>
              <FeeBreakdownValue>
                {isSponsoredIntent && <FreeTag>FREE</FreeTag>}
                {displayValues.bridgeFee}
              </FeeBreakdownValue>
            </FeeBreakdownRow>
            {isDefined(displayValues.swapImpact) && (
              <FeeBreakdownRow>
                <FeeBreakdownLabel>
                  <span>Swap Impact</span>
                  <Tooltip
                    tooltipId="ConfirmationButton - Swap impact"
                    body="Estimated price difference from pool depth and trade size"
                  >
                    <Info color="inherit" width="16px" height="16px" />
                  </Tooltip>
                </FeeBreakdownLabel>
                <FeeBreakdownValue>
                  {isSponsoredIntent && <FreeTag>FREE</FreeTag>}
                  {displayValues.swapImpact}
                </FeeBreakdownValue>
              </FeeBreakdownRow>
            )}
          </FeeBreakdown>
        </ExpandedDetails>
      </ExpandableLabelSection>
      <CoreConfirmationButton
        state={buttonStatus}
        label={buttonLabel}
        loading={buttonLoading}
        disabled={isButtonDisabled}
        fullHeight={buttonStatus !== "readyToConfirm"}
        onClick={onConfirm}
      />
    </>
  );

  return (
    <>
      <Container
        dark={
          buttonStatus === "validationError" ||
          buttonStatus === "apiError" ||
          buttonLoading
        }
      >
        {content}
      </Container>
      {priceImpact?.tooHigh && (
        <FeeWarning>
          <Warning width="20px" height="20px" color="inherit" />
          High price impact (-{priceImpact.priceImpactFormatted}%)
        </FeeWarning>
      )}
    </>
  );
};

// Styled components
const Container = styled.div<{ dark: boolean }>`
  background: ${({ dark }) =>
    dark ? COLORS["grey-400-5"] : "rgba(108, 249, 216, 0.1)"};
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  padding: 8px 12px 12px 12px;
  width: 100%;
  overflow: hidden;
  transition: background 0.2s ease;
`;

const ExpandedDetails = styled.div`
  color: rgba(224, 243, 255, 0.5);
  font-size: 14px;
  width: 100%;
  padding: 8px 16px 24px;
`;

const DetailRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const DetailLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const DetailRight = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #e0f3ff;
`;

const FeeBreakdown = styled.div`
  padding-left: 16px;
  margin-left: 8px;
  margin-top: 12px;
`;

const FeeBreakdownRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  position: relative;

  &::before {
    content: "";
    width: 10px;
    height: 18px;
    border-radius: 0 0 0 6px;
    border-left: 1px solid currentColor;
    border-bottom: 1px solid currentColor;
    position: absolute;
    left: -16px;
    top: -0.5em;
    opacity: 0.5;
  }
`;

const FeeBreakdownLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: rgba(224, 243, 255, 0.5);
`;

const FeeBreakdownValue = styled(DetailRight)`
  color: #e0f3ff;
`;

const FeeWarning = styled.div`
  height: 36px;
  display: flex;
  padding: 8px 24px;
  justify-content: center;
  align-items: center;
  gap: 8px;
  border-radius: 24px;
  border: 1px solid rgba(255, 97, 102, 0.1);
  background: rgba(255, 97, 102, 0.1);
  color: var(--functional-red);
  font-size: 14px;
  font-style: normal;
  font-weight: 600;

  /* text */
  span {
    height: 100%;
  }
`;

const DetailRightRed = styled(DetailRight)`
  color: var(--functional-red);
  font-weight: 600;
`;

const WarningTooltipBody = styled.span`
  color: var(--functional-red);
  font-weight: 600;
  font-size: 14px;
`;

export const FreeTag = styled.div`
  height: 20px;
  padding-inline: 8px;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  border: 1px solid var(--transparency-aqua-aqua-40);
  background: var(--transparency-aqua-aqua-20);
  color: var(--base-aqua);
  font-size: 12px;
  font-weight: 600;
`;
