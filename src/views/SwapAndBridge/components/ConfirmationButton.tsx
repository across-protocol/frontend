"use client";
import { ButtonHTMLAttributes, useEffect } from "react";
import { ReactComponent as ChevronDownIcon } from "assets/icons/chevron-down.svg";
import { ReactComponent as LoadingIcon } from "assets/icons/loading-2.svg";
import { ReactComponent as Info } from "assets/icons/info.svg";
import { ReactComponent as Wallet } from "assets/icons/wallet.svg";
import { ReactComponent as Across } from "assets/token-logos/acx.svg";
import { ReactComponent as Route } from "assets/icons/route.svg";
import { ReactComponent as Shield } from "assets/icons/shield.svg";
import { ReactComponent as Dollar } from "assets/icons/dollar.svg";
import { ReactComponent as Time } from "assets/icons/time.svg";
import { ReactComponent as Warning } from "assets/icons/warning_triangle_filled.svg";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BigNumber } from "ethers";
import { COLORS, formatUSDString, isDefined } from "utils";
import styled from "@emotion/styled";
import { Tooltip } from "components/Tooltip";
import { NormalizedQuote } from "../hooks/useSwapAndBridgeQuote";
import { TokenWithBalance } from "../hooks/useSwapAndBridgeTokens";

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
  inputToken: TokenWithBalance | null;
  outputToken: TokenWithBalance | null;
  amount: BigNumber | null;
  swapQuote: NormalizedQuote | null;
  isQuoteLoading: boolean;
  onConfirm?: () => Promise<void>;
  // External state props
  buttonState: BridgeButtonState;
  buttonDisabled: boolean;
  buttonLoading: boolean;
  buttonLabel?: string;
}

// Expandable label section component
const ExpandableLabelSection: React.FC<
  React.PropsWithChildren<{
    fee: string;
    time: string;
    expanded: boolean;
    onToggle: () => void;
    visible: boolean;
    state: BridgeButtonState;
    hasQuote: boolean;
    isLoading: boolean;
  }>
> = ({
  fee,
  time,
  expanded,
  onToggle,
  state,
  children,
  hasQuote,
  isLoading,
}) => {
  // Render state-specific content
  let content: React.ReactNode = null;

  const defaultState = (
    <>
      <ExpandableLabelLeft>
        <Shield width="16" height="16" />
        <FastSecureText>Fast & Secure</FastSecureText>
      </ExpandableLabelLeft>
      <ExpandableLabelRightAccent>
        Across V4. More Chains Faster. <Across width="16" height="16" />
      </ExpandableLabelRightAccent>
    </>
  );

  // Show loading state when fetching quote
  if (isLoading) {
    content = defaultState;
  } else if (hasQuote) {
    // Show quote details when available
    content = (
      <>
        <ExpandableLabelLeft>
          <Shield width="16" height="16" />
          <FastSecureText>Fast & Secure</FastSecureText>
        </ExpandableLabelLeft>
        {!expanded && (
          <ExpandableLabelRight>
            <Across />
            <Divider />
            <FeeTimeItem>
              <Dollar width="16" height="16" />
              {fee}
            </FeeTimeItem>
            <Divider />
            <FeeTimeItem>
              <Time width="16" height="16" />
              {time}
            </FeeTimeItem>
          </ExpandableLabelRight>
        )}
        <StyledChevronDown expanded={expanded} />
      </>
    );
  } else {
    // Default state - show Across V4 branding
    content = defaultState;
  }

  return (
    <>
      <ExpandableLabelButton
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        disabled={!hasQuote || isLoading}
      >
        {content}
      </ExpandableLabelButton>
      <AnimatePresence initial={false} mode="wait">
        {expanded && (
          <motion.div
            key="expandable-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              transition: {
                type: "spring",
                stiffness: 400,
                damping: 25,
                mass: 0.8,
              },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                duration: 0.2,
                ease: "easeInOut",
              },
            }}
            style={{ overflow: "hidden", willChange: "height, opacity" }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Core button component, used by all states
const ButtonCore: React.FC<{
  label: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  state: BridgeButtonState;
  fullHeight?: boolean;
  onClick?: () => void;
}> = ({ label, loading, disabled, state, onClick, fullHeight }) => (
  <StyledButton
    disabled={disabled || loading}
    onClick={onClick}
    aqua={!disabled}
    loading={loading}
    fullHeight={fullHeight}
  >
    <ButtonContent>
      {loading && <StyledLoadingIcon />}
      {state === "notConnected" && (
        <Wallet width={16} height={16} color="inherit" />
      )}
      {state === "apiError" && (
        <Warning width={16} height={16} color="inherit" />
      )}
      {label}
    </ButtonContent>
  </StyledButton>
);

export const ConfirmationButton: React.FC<ConfirmationButtonProps> = ({
  inputToken,
  outputToken,
  amount,
  swapQuote,
  isQuoteLoading,
  onConfirm,
  buttonState,
  buttonDisabled,
  buttonLoading,
  buttonLabel,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  const state = buttonState;

  // Calculate display values from swapQuote
  // Resolve conversion helpers outside memo to respect hooks rules

  const displayValues = React.useMemo(() => {
    if (!swapQuote || !inputToken || !outputToken) {
      return {
        fee: "-",
        time: "-",
        route: "Across V4",
        estimatedTime: "-",
        totalFee: "-",
        fees: [],
      };
    }

    // Get total fee from fees array (first item is usually Total Fee)
    const totalFeeItem = swapQuote.fees.find((f) => f.label === "Total Fee");
    const totalFeeUsd = totalFeeItem?.value || 0;

    // Get estimated time from normalized quote
    const totalSeconds = swapQuote.estimatedFillTimeSeconds || 0;
    const underOneMinute = totalSeconds < 60;
    const time =
      totalSeconds > 0
        ? underOneMinute
          ? `~${Math.max(1, Math.round(totalSeconds))} secs`
          : `~${Math.ceil(totalSeconds / 60)} min`
        : "-";

    // Filter fees to only show those >= 1 cent, excluding Total Fee (shown separately)
    const feeBreakdown = swapQuote.fees.filter(
      (fee) => fee.value >= 0.01 && fee.label !== "Total Fee"
    );

    return {
      totalFee: totalFeeUsd > 0 ? formatUSDString(totalFeeUsd.toString()) : "-",
      time,
      route: "Across V4",
      estimatedTime: time,
      fees: feeBreakdown,
    };
  }, [swapQuote, inputToken, outputToken, amount]);

  // When notConnected, make button clickable so it can open wallet modal
  const isButtonDisabled = state === "notConnected" ? false : buttonDisabled;

  useEffect(() => {
    if (!swapQuote) {
      setExpanded(false);
    }
  }, [swapQuote]);

  // Render unified group driven by state
  const content = (
    <>
      <ExpandableLabelSection
        fee={displayValues.totalFee}
        time={displayValues.time}
        expanded={expanded}
        onToggle={() => setExpanded((e) => !e)}
        visible={true}
        state={state}
        hasQuote={!!swapQuote}
        isLoading={isQuoteLoading}
      >
        <ExpandedDetails>
          <DetailRow>
            <DetailLeft>
              <Route width="16px" height="16px" />
              <span>Route</span>
            </DetailLeft>
            <DetailRight>
              <Across width="20px" height="20px" />
              <span>{displayValues.route}</span>
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
              {(() => {
                const totalFeeItem = swapQuote?.fees.find(
                  (f) => f.label === "Total Fee"
                );
                return totalFeeItem?.description ? (
                  <Tooltip
                    tooltipId="ConfirmationButton - total fee"
                    body={totalFeeItem.description}
                  >
                    <Info color="inherit" width="16px" height="16px" />
                  </Tooltip>
                ) : null;
              })()}
            </DetailLeft>
            <DetailRight>{displayValues.totalFee}</DetailRight>
          </DetailRow>
          {displayValues.fees.length > 0 && (
            <FeeBreakdown>
              {displayValues.fees.map((fee) => (
                <FeeBreakdownRow key={fee.label}>
                  <FeeBreakdownLabel>
                    <span>{fee.label}</span>
                    {fee.description && (
                      <Tooltip
                        tooltipId={`ConfirmationButton - ${fee.label}`}
                        body={fee.description}
                      >
                        <Info color="inherit" width="16px" height="16px" />
                      </Tooltip>
                    )}
                  </FeeBreakdownLabel>
                  <FeeBreakdownValue>
                    {formatUSDString(fee.value.toString())}
                  </FeeBreakdownValue>
                </FeeBreakdownRow>
              ))}
            </FeeBreakdown>
          )}
        </ExpandedDetails>
      </ExpandableLabelSection>
      <ButtonCore
        state={state}
        label={buttonLabel}
        loading={buttonLoading}
        disabled={isButtonDisabled}
        fullHeight={state !== "readyToConfirm"}
        onClick={onConfirm}
      />
    </>
  );

  return (
    <Container
      dark={
        buttonState === "validationError" ||
        buttonState === "apiError" ||
        buttonLoading
      }
    >
      {content}
    </Container>
  );
};

// Styled components
const Container = styled(motion.div)<{ dark: boolean }>`
  background: ${({ dark }) =>
    dark ? COLORS["grey-400-5"] : "rgba(108, 249, 216, 0.1)"};
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  padding: 8px 12px 12px 12px;
  width: 100%;
  overflow: hidden;
`;

const ExpandableLabelButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px;
  padding-bottom: 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  user-select: none;
`;

const ExpandableLabelLeft = styled.span`
  color: ${COLORS.aqua};
  font-weight: 600;
  font-size: 14px;
  flex: 1;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-start;
`;

const FastSecureText = styled.span`
  color: ${COLORS.aqua};
`;

const ExpandableLabelRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #e0f3ff;
  justify-content: flex-end;
`;

const ExpandableLabelRightAccent = styled(ExpandableLabelLeft)`
  text-align: right;
  justify-content: flex-end;
`;

const FeeTimeItem = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Divider = styled.span`
  margin: 0 8px;
  height: 16px;
  width: 1px;
  background: rgba(224, 243, 255, 0.5);
`;

const StyledChevronDown = styled(ChevronDownIcon)<{ expanded: boolean }>`
  width: 20px;
  height: 20px;
  margin-left: 12px;
  transition: transform 0.2s ease;
  cursor: pointer;
  color: #e0f3ff;
  transform: ${({ expanded }) =>
    expanded ? "rotate(180deg)" : "rotate(0deg)"};
`;

const StyledButton = styled.button<{
  aqua?: boolean;
  loading?: boolean;
  fullHeight?: boolean;
}>`
  width: 100%;
  height: 64px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  transition:
    background 0.3s ease,
    color 0.3s ease,
    box-shadow 0.3s ease,
    opacity 0.3s ease;
  border: none;
  cursor: pointer;

  background: ${({ aqua }) =>
    aqua ? COLORS.aqua : "rgba(224, 243, 255, 0.05)"};
  color: ${({ aqua }) => (aqua ? "#2D2E33" : "#E0F3FF")};

  &:not(:disabled):hover {
    box-shadow: ${({ aqua }) =>
      aqua
        ? `0 0 10px 0 var(--Transparency-Bright-Gray-bright-gray-50, rgba(224, 243, 255, 0.50)) inset, 0 0 4px 2px var(--Transparency-Aqua-aqua-20, rgba(108, 249, 216, 0.20)), 0 2px 12px 1px var(--Transparency-Aqua-aqua-20, rgba(108, 249, 216, 0.20)), 0 4px 24px 2px var(--Transparency-Aqua-aqua-20, rgba(108, 249, 216, 0.20))`
        : `
      `};
  }

  &:not(:disabled):focus {
    ${({ aqua }) => !aqua && `box-shadow: 0 0 16px 0 ${COLORS.aqua};`}
  }

  &:disabled {
    cursor: ${({ loading }) => (loading ? "wait" : "not-allowed")};
    box-shadow: none;
    opacity: ${({ loading }) => (loading ? 0.9 : 0.6)};
  }
`;

const ButtonContent = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const StyledLoadingIcon = styled(LoadingIcon)`
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
  color: inherit;

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
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
  gap: 8px;
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
  margin-bottom: 4px;
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

const FeeBreakdownValue = styled.span`
  color: #e0f3ff;
`;
