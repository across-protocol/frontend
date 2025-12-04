"use client";
import React, { ButtonHTMLAttributes, useEffect } from "react";
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
import { AnimatePresence, motion } from "framer-motion";
import { BigNumber } from "ethers";
import { COLORS, isDefined } from "utils";
import styled from "@emotion/styled";
import { Tooltip } from "components/Tooltip";
import { SwapApprovalApiCallReturnType } from "utils/serverless-api/prod/swap-approval";
import { EnrichedToken } from "../ChainTokenSelector/ChainTokenSelectorModal";
import { getSwapQuoteFees, PriceImpact } from "../../utils/fees";
import { ProviderBadge } from "./BridgeProvider";
import { BridgeProvider, getProviderFromQuote } from "./provider";

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
  inputToken: EnrichedToken | null;
  outputToken: EnrichedToken | null;
  amount: BigNumber | null;
  swapQuote: SwapApprovalApiCallReturnType | null;
  isQuoteLoading: boolean;
  onConfirm?: () => Promise<void>;
  // External state props
  buttonState: BridgeButtonState;
  buttonDisabled: boolean;
  buttonLoading: boolean;
  buttonLabel?: string;
  priceImpact?: PriceImpact;
  initialExpanded?: boolean;
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
    priceImpact?: PriceImpact;
    provider: BridgeProvider;
  }>
> = ({
  fee,
  time,
  expanded,
  onToggle,
  priceImpact,
  children,
  hasQuote,
  provider,
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

  const isSponsoredIntent = provider === "sponsored-intent";

  // Show quote breakdown when quote is available, otherwise show default state
  if (hasQuote) {
    // Show quote details when available
    content = (
      <>
        <ExpandableLabelLeft>
          <Shield width="16" height="16" />
          <FastSecureText>Fast & Secure</FastSecureText>
        </ExpandableLabelLeft>
        {!expanded && (
          <ExpandableLabelRight>
            <ProviderBadge
              expanded={expanded}
              provider={provider}
            ></ProviderBadge>
            <Divider />
            <FeeTimeItem>
              {priceImpact?.tooHigh ? (
                <FeeTimeItemRed>
                  <Warning
                    color="var(--functional-red)"
                    width="16"
                    height="16"
                  />
                  <span>
                    {fee} (-{priceImpact.priceImpactFormatted}%)
                  </span>
                </FeeTimeItemRed>
              ) : (
                <>
                  <Dollar width="16" height="16" />
                  {isSponsoredIntent && <FreeTag>FREE</FreeTag>}
                  {fee}
                </>
              )}
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
        disabled={!hasQuote}
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
    data-cy="bridge-button"
    disabled={disabled || loading}
    onClick={onClick}
    aqua={!disabled}
    buttonLoading={loading}
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
  onConfirm,
  buttonState,
  buttonDisabled,
  buttonLoading,
  buttonLabel,
  priceImpact,
  initialExpanded = false,
}) => {
  const [expanded, setExpanded] = React.useState(initialExpanded);

  const state = buttonState;

  // Calculate display values from swapQuote
  // Resolve conversion helpers outside memo to respect hooks rules

  const displayValues = React.useMemo(() => {
    if (!swapQuote || !inputToken || !outputToken || !swapQuote.fees) {
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
  }, [swapQuote, inputToken, outputToken, amount]);

  // When notConnected, make button clickable so it can open wallet modal
  const isButtonDisabled = state === "notConnected" ? false : buttonDisabled;

  useEffect(() => {
    if (!swapQuote) {
      setExpanded(false);
    }
  }, [swapQuote]);

  const provider = getProviderFromQuote(swapQuote);
  const isSponsoredIntent = provider === "sponsored-intent";
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
    <>
      <Container
        dark={
          buttonState === "validationError" ||
          buttonState === "apiError" ||
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
  gap: 6px;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 130%;
`;

const Divider = styled.span`
  margin: 0 8px;
  height: 16px;
  width: 1px;
  background: rgba(224, 243, 255, 0.5);
`;

const StyledChevronDown = styled(ChevronDownIcon, {
  shouldForwardProp: (prop) => prop !== "expanded",
})<{ expanded: boolean }>`
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
  buttonLoading?: boolean;
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
    cursor: ${({ buttonLoading }) => (buttonLoading ? "wait" : "not-allowed")};
    box-shadow: none;
    opacity: ${({ buttonLoading }) => (buttonLoading ? 0.9 : 0.6)};
  }

  &:focus {
    outline: none;
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

const FeeTimeItemRed = styled(FeeTimeItem)`
  background: rgba(255, 97, 102, 0.2);
  border-radius: 999px;
  height: 20px;
  padding-inline: 6px;
  margin-inline: -6px; // account for inline padding

  span {
    height: 100%;
  }
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
