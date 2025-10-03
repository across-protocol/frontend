"use client";
import { ButtonHTMLAttributes } from "react";
import { ReactComponent as ChevronDownIcon } from "assets/icons/chevron-down.svg";
import { ReactComponent as LoadingIcon } from "assets/icons/loading-2.svg";
import { ReactComponent as Info } from "assets/icons/info.svg";
import { ReactComponent as Wallet } from "assets/icons/wallet.svg";
import { ReactComponent as Across } from "assets/token-logos/acx.svg";
import { ReactComponent as Route } from "assets/icons/route.svg";
import { ReactComponent as Shield } from "assets/icons/shield.svg";
import { ReactComponent as Dollar } from "assets/icons/dollar.svg";
import { ReactComponent as Time } from "assets/icons/time.svg";
import { ReactComponent as Warning } from "assets/icons/warning_triangle.svg";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BigNumber } from "ethers";
import { COLORS, formatUSD, getConfig } from "utils";
import { useTokenConversion } from "hooks/useTokenConversion";
import { EnrichedTokenSelect } from "./ChainTokenSelector/SelectorButton";
import styled from "@emotion/styled";
import { AmountInputError } from "../../Bridge/utils";
import { Tooltip } from "components/Tooltip";

type SwapQuoteResponse = {
  checks: object;
  steps: object;
  refundToken: object;
  inputAmount: string;
  expectedOutputAmount: string;
  minOutputAmount: string;
  expectedFillTime: number;
  swapTx: object;
};

export type BridgeButtonState =
  | "notConnected"
  | "awaitingTokenSelection"
  | "awaitingAmountInput"
  | "readyToConfirm"
  | "submitting"
  | "wrongNetwork"
  | "loadingQuote"
  | "validationError";

interface ConfirmationButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  inputToken: EnrichedTokenSelect | null;
  outputToken: EnrichedTokenSelect | null;
  amount: BigNumber | null;
  swapQuote: SwapQuoteResponse | null;
  isQuoteLoading: boolean;
  onConfirm?: () => void;
  validationError?: AmountInputError;
  validationWarning?: AmountInputError;
  validationErrorFormatted?: string;
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
    validationError?: AmountInputError;
    validationWarning?: AmountInputError;
    validationErrorFormatted?: string;
  }>
> = ({
  fee,
  time,
  expanded,
  onToggle,
  state,
  children,
  hasQuote,
  validationError,
  validationErrorFormatted,
}) => {
  // Render state-specific content
  let content: React.ReactNode = null;
  if (validationError && validationErrorFormatted) {
    content = (
      <>
        <ValidationText>
          <Warning color="inherit" width="20px" height="20px" />
          <span>{validationErrorFormatted}</span>
        </ValidationText>
      </>
    );
  } else if (hasQuote) {
    content = (
      <>
        <ExpandableLabelLeft>
          <Shield width="16" height="16" />
          <FastSecureText>Fast & Secure</FastSecureText>
        </ExpandableLabelLeft>
        <ExpandableLabelRight>
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
        <StyledChevronDown expanded={expanded} />
      </>
    );
  } else {
    content = (
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
  }

  return (
    <AnimatePresence initial={false}>
      <motion.div
        key="expandable-label-section"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        <ExpandableLabelButton
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          disabled={state !== "readyToConfirm"}
        >
          {content}
        </ExpandableLabelButton>
        <ExpandableContent expanded={expanded}>
          {expanded && children}
        </ExpandableContent>
      </motion.div>
    </AnimatePresence>
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
    aqua={state !== "validationError"}
    loading={loading}
    fullHeight={fullHeight}
  >
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={state}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        <ButtonContent>
          {loading && <StyledLoadingIcon />}
          {state === "notConnected" && (
            <Wallet width={16} height={16} color="inherit" />
          )}
          {label}
        </ButtonContent>
      </motion.span>
    </AnimatePresence>
  </StyledButton>
);

export const ConfirmationButton: React.FC<ConfirmationButtonProps> = ({
  inputToken,
  outputToken,
  amount,
  swapQuote,
  onConfirm,
  validationError,
  validationWarning,
  validationErrorFormatted,
  buttonState,
  buttonDisabled,
  buttonLoading,
  buttonLabel,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  const state = buttonState;

  // Calculate display values from swapQuote
  // Resolve conversion helpers outside memo to respect hooks rules
  const bridgeTokenSymbol =
    (swapQuote as any)?.steps?.bridge?.tokenOut?.symbol ||
    outputToken?.symbol ||
    "ETH";
  const destinationNativeSymbol = getConfig().getNativeTokenInfo(
    outputToken?.chainId || 1
  ).symbol;
  const { convertTokenToBaseCurrency: convertInputTokenToUsd } =
    useTokenConversion(inputToken?.symbol || "ETH", "usd");
  const { convertTokenToBaseCurrency: convertBridgeTokenToUsd } =
    useTokenConversion(bridgeTokenSymbol, "usd");
  const { convertTokenToBaseCurrency: convertDestinationNativeToUsd } =
    useTokenConversion(destinationNativeSymbol, "usd");

  const displayValues = React.useMemo(() => {
    const toBN = (v: any) => {
      try {
        return BigNumber.from(v ?? 0);
      } catch {
        return BigNumber.from(0);
      }
    };

    const formatUsdString = (v?: BigNumber) => {
      if (!v) return "-";
      try {
        return `$${formatUSD(v)}`;
      } catch {
        return "-";
      }
    };

    if (!swapQuote || !inputToken || !outputToken) {
      return {
        fee: "-",
        time: "-",
        bridgeFee: "-",
        destinationGasFee: "-",
        extraFee: "-",
        route: "Across V4",
        estimatedTime: "-",
        netFee: "-",
      };
    }

    const fees = (swapQuote as any)?.steps?.bridge?.fees || {};
    const relayerCapitalTotal = toBN(fees?.relayerCapital?.total);
    const lpTotal = toBN(fees?.lp?.total);
    const relayerGasTotal = toBN(fees?.relayerGas?.total);

    // Convert components to USD
    const bridgeFeeTokenAmount = relayerCapitalTotal.add(lpTotal);
    const bridgeFeeUsd = convertBridgeTokenToUsd(bridgeFeeTokenAmount);
    const gasFeeUsd = convertDestinationNativeToUsd(relayerGasTotal);

    // Approximate swap fee in USD if we have user input and bridge input
    const bridgeInputAmount = toBN(
      (swapQuote as any)?.steps?.bridge?.inputAmount
    );
    const inputAmountUsd = convertInputTokenToUsd(amount ?? BigNumber.from(0));
    const bridgeInputUsd = convertBridgeTokenToUsd(bridgeInputAmount);
    const swapFeeUsd =
      inputAmountUsd && bridgeInputUsd && inputAmountUsd.gt(bridgeInputUsd)
        ? inputAmountUsd.sub(bridgeInputUsd)
        : BigNumber.from(0);

    const netFeeUsd = (bridgeFeeUsd || BigNumber.from(0))
      .add(gasFeeUsd || BigNumber.from(0))
      .add(swapFeeUsd || BigNumber.from(0));

    const totalSeconds = Math.max(0, Number(swapQuote.expectedFillTime || 0));
    const underOneMinute = totalSeconds < 60;
    const time = underOneMinute
      ? `~${Math.max(1, Math.round(totalSeconds))} secs`
      : `~${Math.ceil(totalSeconds / 60)} min`;

    return {
      fee: formatUsdString(netFeeUsd),
      time,
      bridgeFee: formatUsdString(bridgeFeeUsd),
      destinationGasFee: formatUsdString(gasFeeUsd),
      extraFee: formatUsdString(swapFeeUsd),
      route: "Across V4",
      estimatedTime: time,
      netFee: formatUsdString(netFeeUsd),
    };
  }, [
    swapQuote,
    inputToken,
    outputToken,
    amount,
    convertInputTokenToUsd,
    convertBridgeTokenToUsd,
    convertDestinationNativeToUsd,
  ]);

  const clickHandler = onConfirm;

  // Render unified group driven by state
  const content = (
    <>
      <AnimatePresence initial={true}>
        <motion.div
          key="expandable-label-section-outer"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ overflow: "hidden" }}
        >
          <ExpandableLabelSection
            fee={displayValues.fee}
            time={displayValues.time}
            expanded={expanded}
            onToggle={() => setExpanded((e) => !e)}
            visible={true}
            state={state}
            validationError={validationError}
            validationWarning={validationWarning}
            validationErrorFormatted={validationErrorFormatted}
            hasQuote={!!swapQuote}
          >
            {expanded && state === "readyToConfirm" ? (
              <ExpandedDetails>
                <DetailRow>
                  <DetailLeft>
                    <Route width="20px" height="20px" />
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
                  <span>{displayValues.estimatedTime}</span>
                </DetailRow>
                <DetailRow>
                  <DetailLeft>
                    <Dollar width="16px" height="16px" />
                    <span>Net Fee</span>
                    <Tooltip
                      tooltipId="ConfirmationButton - net fee"
                      body="Total fees less any reward, in USD"
                    >
                      <Info width="16px" height="16px" />
                    </Tooltip>
                  </DetailLeft>
                  <span>{displayValues.netFee}</span>
                </DetailRow>
                <FeeBreakdown>
                  <FeeBreakdownRow>
                    <FeeBreakdownLabel>Bridge Fee</FeeBreakdownLabel>
                    <FeeBreakdownValue>
                      {displayValues.bridgeFee}
                    </FeeBreakdownValue>
                  </FeeBreakdownRow>
                  <FeeBreakdownRow>
                    <FeeBreakdownLabel>Destination Gas Fee</FeeBreakdownLabel>
                    <FeeBreakdownValue>
                      {displayValues.destinationGasFee}
                    </FeeBreakdownValue>
                  </FeeBreakdownRow>
                  <FeeBreakdownRow>
                    <FeeBreakdownLabel>Extra Fee</FeeBreakdownLabel>
                    <FeeBreakdownValue>
                      {displayValues.extraFee}
                    </FeeBreakdownValue>
                  </FeeBreakdownRow>
                </FeeBreakdown>
              </ExpandedDetails>
            ) : null}
          </ExpandableLabelSection>
        </motion.div>
      </AnimatePresence>
      <ButtonContainer expanded={expanded}>
        <ButtonCore
          state={state}
          label={buttonLabel}
          loading={buttonLoading}
          disabled={buttonDisabled}
          fullHeight={state !== "readyToConfirm"}
          onClick={clickHandler}
        />
      </ButtonContainer>
    </>
  );

  return (
    <Container
      state={state}
      initial={false}
      transition={{ type: "spring", stiffness: 300, damping: 40 }}
    >
      {content}
    </Container>
  );
};

const ValidationText = styled.div`
  color: ${COLORS.white};
  font-size: 14px;
  font-weight: 400;
  margin-inline: auto;
  display: flex;
  align-items: center;
  gap: 4px;
`;

// Styled components
const Container = styled(motion.div)<{ state: BridgeButtonState }>`
  background: ${({ state }) =>
    state === "validationError"
      ? COLORS["grey-400-5"]
      : "rgba(108, 249, 216, 0.1)"};
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  padding: 8px 12px 12px 12px;
  width: 100%;
  overflow: hidden;
  gap: ${({ state }) => (state === "readyToConfirm" ? "8px" : "0")};
`;

const ExpandableLabelButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px;
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
  transition: transform 0.3s ease;
  cursor: pointer;
  color: #e0f3ff;
  transform: ${({ expanded }) =>
    expanded ? "rotate(180deg)" : "rotate(0deg)"};
`;

const ExpandableContent = styled.div<{ expanded: boolean }>`
  overflow: hidden;
  transition:
    max-height 0.3s ease,
    margin-top 0.3s ease;
  max-height: ${({ expanded }) => (expanded ? "500px" : "0")};
  margin-top: ${({ expanded }) => (expanded ? "8px" : "0")};
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
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;

  background: ${({ aqua }) =>
    aqua ? COLORS.aqua : "rgba(224, 243, 255, 0.05)"};
  color: ${({ aqua }) => (aqua ? "#2D2E33" : "#E0F3FF")};

  &:not(:disabled):hover {
    ${({ aqua }) =>
      aqua
        ? `background: rgba(108, 249, 216, 0.1);`
        : `
        box-shadow: 0 0 16px 0 ${COLORS.aqua};
        background: ${COLORS.aqua};
      `}
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

const ButtonContainer = styled.div<{ expanded: boolean }>`
  flex: 0 0 auto;
`;

const ExpandedDetails = styled.div`
  color: #e0f3ff;
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
  gap: 8px;
`;

const DetailRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FeeBreakdown = styled.div`
  padding-left: 24px;
  border-left: 1px solid rgba(224, 243, 255, 0.1);
  margin-left: 8px;
`;

const FeeBreakdownRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
`;

const FeeBreakdownLabel = styled.span`
  color: rgba(224, 243, 255, 0.7);
`;

const FeeBreakdownValue = styled.span`
  color: #e0f3ff;
`;

export default ConfirmationButton;
