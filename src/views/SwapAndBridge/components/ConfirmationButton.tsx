"use client";
import { ButtonHTMLAttributes } from "react";
import { ReactComponent as ChevronDownIcon } from "assets/icons/chevron-down.svg";
import { ReactComponent as LoadingIcon } from "assets/icons/loading-2.svg";
import { ReactComponent as Info } from "assets/icons/info.svg";
import { ReactComponent as Wallet } from "assets/icons/wallet.svg";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BigNumber } from "ethers";
import { COLORS, formatUSD, getConfig } from "utils";
import { useTokenConversion } from "hooks/useTokenConversion";
import { useConnection, useIsWrongNetwork } from "hooks";
import { EnrichedTokenSelect } from "./ChainTokenSelector/SelectorButton";
import styled from "@emotion/styled";

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
  | "loadingQuote";

interface ConfirmationButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  inputToken: EnrichedTokenSelect | null;
  outputToken: EnrichedTokenSelect | null;
  amount: BigNumber | null;
  swapQuote: SwapQuoteResponse | null;
  isQuoteLoading: boolean;
  onConfirm?: () => void;
}

// Expandable label section component
const ExpandableLabelSection: React.FC<
  React.PropsWithChildren<{
    fee: string;
    time: string;
    expanded: boolean;
    onToggle: () => void;
    visible: boolean;
  }>
> = ({ fee, time, expanded, onToggle, visible, children }) => {
  return (
    <AnimatePresence initial={false}>
      {visible && (
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
          >
            <ExpandableLabelLeft>
              <ShieldIcon
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M7.63107 1.42901C7.87053 1.34918 8.12947 1.34918 8.36893 1.42901L13.2023 3.04012C13.6787 3.19892 14 3.64474 14 4.14692V7.94133C14 9.7662 13.211 11.1131 12.0941 12.1729C10.9961 13.2147 9.56027 13.9981 8.2374 14.7117C8.0892 14.7917 7.9108 14.7917 7.7626 14.7117C6.43971 13.9981 5.00387 13.2147 3.90584 12.1729C2.78901 11.1131 2 9.7662 2 7.94133V4.14692C2 3.64475 2.32133 3.19892 2.79773 3.04012L7.63107 1.42901ZM10.1869 6.68686C10.3821 6.49162 10.3821 6.17504 10.1869 5.97978C9.9916 5.78452 9.67507 5.78452 9.4798 5.97978L7.33333 8.1262L6.52022 7.31313C6.32496 7.11786 6.00837 7.11786 5.81311 7.31313C5.61785 7.5084 5.61785 7.82493 5.81311 8.0202L6.9798 9.18686C7.07353 9.28066 7.20073 9.33333 7.33333 9.33333C7.46593 9.33333 7.59313 9.28066 7.68687 9.18686L10.1869 6.68686Z"
                  fill="#6CF9D8"
                />
              </ShieldIcon>
              <FastSecureText>Fast & Secure</FastSecureText>
            </ExpandableLabelLeft>
            <ExpandableLabelRight>
              <FeeTimeItem>
                <GasIcon
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g opacity="0.5">
                    <path
                      d="M9.49967 13.5H10.1663M9.49967 13.5V6.5M9.49967 13.5H2.49967M9.49967 6.5V3.16667C9.49967 2.79848 9.20121 2.5 8.83301 2.5H3.16634C2.79815 2.5 2.49967 2.79848 2.49967 3.16667V13.5M9.49967 6.5H11.1663C11.5345 6.5 11.833 6.79847 11.833 7.16667V10.8333C11.833 11.2015 12.1315 11.5 12.4997 11.5H13.4997C13.8679 11.5 14.1663 11.2015 14.1663 10.8333V5.63024C14.1663 5.44125 14.0861 5.26114 13.9457 5.13471L12.4997 3.83333M2.49967 13.5H1.83301M7.49967 6.5H4.49967"
                      stroke="#E0F3FF"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                </GasIcon>
                {fee}
              </FeeTimeItem>
              <Divider />
              <FeeTimeItem>
                <TimeIcon
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g opacity="0.5">
                    <path
                      d="M7.99967 5.16683V8.00016L9.83301 9.8335M14.1663 8.00016C14.1663 11.4059 11.4054 14.1668 7.99967 14.1668C4.59392 14.1668 1.83301 11.4059 1.83301 8.00016C1.83301 4.59441 4.59392 1.8335 7.99967 1.8335C11.4054 1.8335 14.1663 4.59441 14.1663 8.00016Z"
                      stroke="#E0F3FF"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                </TimeIcon>
                {time}
              </FeeTimeItem>
            </ExpandableLabelRight>
            <StyledChevronDown expanded={expanded} />
          </ExpandableLabelButton>
          <ExpandableContent expanded={expanded}>
            {expanded && children}
          </ExpandableContent>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Core button component, used by all states
const ButtonCore: React.FC<
  ConfirmationButtonProps & {
    label: React.ReactNode;
    loading?: boolean;
    aqua?: boolean;
    state: BridgeButtonState;
    fullHeight?: boolean;
  }
> = ({
  label,
  loading,
  disabled,
  aqua,
  state,
  onConfirm,
  onClick,
  fullHeight,
}) => (
  <StyledButton
    disabled={disabled || loading}
    onClick={state === "readyToConfirm" ? onConfirm : onClick}
    aqua={aqua}
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
        <ButtonContent>{label}</ButtonContent>
      </motion.span>
    </AnimatePresence>
  </StyledButton>
);

export const ConfirmationButton: React.FC<ConfirmationButtonProps> = ({
  inputToken,
  outputToken,
  amount,
  swapQuote,
  isQuoteLoading,
  onConfirm,
  ...props
}) => {
  const { account, connect } = useConnection();
  const [expanded, setExpanded] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { isWrongNetworkHandler, isWrongNetwork } = useIsWrongNetwork(
    inputToken?.chainId
  );

  // Determine the current state
  const getButtonState = (): BridgeButtonState => {
    if (isSubmitting) return "submitting";
    if (!account) return "notConnected";
    if (!inputToken || !outputToken) return "awaitingTokenSelection";
    if (!amount || amount.lte(0)) return "awaitingAmountInput";
    if (isWrongNetwork) return "wrongNetwork";
    if (isQuoteLoading) return "loadingQuote";
    return "readyToConfirm";
  };

  const state = getButtonState();

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

  // Handle confirmation
  const handleConfirm = async () => {
    if (!onConfirm) return;

    setIsSubmitting(true);
    try {
      onConfirm();
    } catch (error) {
      console.error("Confirmation failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stateLabels: Record<BridgeButtonState, React.ReactNode> = {
    notConnected: (
      <>
        <Wallet />
        <span>Connect Wallet</span>
      </>
    ),
    awaitingTokenSelection: "Select Token",
    awaitingAmountInput: "Input Amount",
    readyToConfirm: "Confirm Swap",
    submitting: "Submitting...",
    wrongNetwork: "Switch Network",
    loadingQuote: (
      <>
        <StyledLoadingIcon />
        <span>Finalizing Quote</span>
      </>
    ),
  };

  // Render state-specific content
  let content: React.ReactNode = null;
  switch (state) {
    case "readyToConfirm":
      content = (
        <>
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
            >
              {expanded ? (
                <ExpandedDetails>
                  <DetailRow>
                    <DetailLeft>
                      <RouteIcon
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g opacity="0.5">
                          <path
                            d="M8.00072 6V2.5H12.6613C12.8745 2.5 13.075 2.60205 13.2004 2.77455L14.0349 3.92196C14.2116 4.16489 14.204 4.49597 14.0163 4.73053L13.2009 5.74979C13.0744 5.90794 12.8829 6 12.6803 6H8.00072ZM8.00072 6V9.33333M8.00072 6H3.32116C3.11864 6 2.92709 6.09206 2.80058 6.25021L2.00058 7.2502C1.8058 7.49367 1.8058 7.83967 2.00058 8.08313L2.80058 9.08313C2.92709 9.24127 3.11864 9.33333 3.32116 9.33333H8.00072M8.00072 9.33333V13.5M8.00072 13.5H5.16741M8.00072 13.5H10.8341"
                            stroke="#E0F3FF"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </g>
                      </RouteIcon>
                      <span>Route</span>
                    </DetailLeft>
                    <DetailRight>
                      <RouteDot />
                      <span>{displayValues.route}</span>
                    </DetailRight>
                  </DetailRow>
                  <DetailRow>
                    <DetailLeft>
                      <SmallInfoIcon />
                      <span>Est. Time</span>
                    </DetailLeft>
                    <span>{displayValues.estimatedTime}</span>
                  </DetailRow>
                  <DetailRow>
                    <DetailLeft>
                      <SmallInfoIcon />
                      <span>Net Fee</span>
                      <SmallInfoIcon />
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
          <ButtonContainer expanded={expanded}>
            <ButtonCore
              {...props}
              state={state}
              label={stateLabels.readyToConfirm}
              loading={isQuoteLoading}
              onConfirm={handleConfirm}
              inputToken={inputToken}
              outputToken={outputToken}
              amount={amount}
              swapQuote={swapQuote}
              isQuoteLoading={isQuoteLoading}
              fullHeight={false}
            />
          </ButtonContainer>
        </>
      );
      break;
    case "notConnected":
      content = (
        <ButtonCore
          {...props}
          state={state}
          label={stateLabels.notConnected}
          aqua
          inputToken={inputToken}
          outputToken={outputToken}
          amount={amount}
          swapQuote={swapQuote}
          isQuoteLoading={isQuoteLoading}
          onConfirm={onConfirm}
          fullHeight={true}
          onClick={() => connect()}
        />
      );
      break;
    case "wrongNetwork":
      content = (
        <ButtonCore
          {...props}
          state={state}
          label={stateLabels.wrongNetwork}
          aqua
          inputToken={inputToken}
          outputToken={outputToken}
          amount={amount}
          swapQuote={swapQuote}
          isQuoteLoading={isQuoteLoading}
          onConfirm={onConfirm}
          fullHeight={true}
          onClick={() => isWrongNetworkHandler()}
        />
      );
      break;
    case "awaitingTokenSelection":
      content = (
        <ButtonCore
          {...props}
          state={state}
          label={stateLabels.awaitingTokenSelection}
          aqua
          inputToken={inputToken}
          outputToken={outputToken}
          amount={amount}
          swapQuote={swapQuote}
          isQuoteLoading={isQuoteLoading}
          onConfirm={onConfirm}
          fullHeight={true}
        />
      );
      break;
    case "awaitingAmountInput":
      content = (
        <ButtonCore
          {...props}
          state={state}
          label={stateLabels.awaitingAmountInput}
          aqua
          inputToken={inputToken}
          outputToken={outputToken}
          amount={amount}
          swapQuote={swapQuote}
          isQuoteLoading={isQuoteLoading}
          onConfirm={onConfirm}
          fullHeight={true}
        />
      );
      break;
    case "submitting":
      content = (
        <ButtonCore
          {...props}
          state={state}
          label={stateLabels.submitting}
          loading
          aqua
          inputToken={inputToken}
          outputToken={outputToken}
          amount={amount}
          swapQuote={swapQuote}
          isQuoteLoading={isQuoteLoading}
          onConfirm={onConfirm}
          fullHeight={true}
        />
      );
      break;
    case "loadingQuote":
      content = (
        <ButtonCore
          {...props}
          state={state}
          label={stateLabels.loadingQuote}
          loading
          aqua
          inputToken={inputToken}
          outputToken={outputToken}
          amount={amount}
          swapQuote={swapQuote}
          isQuoteLoading={isQuoteLoading}
          onConfirm={onConfirm}
          fullHeight={true}
        />
      );
      break;
    default:
      content = null;
  }

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

// Styled components
const Container = styled(motion.div)<{ state: BridgeButtonState }>`
  background: rgba(108, 249, 216, 0.1);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  padding: ${({ state }) =>
    state === "readyToConfirm" || state === "submitting"
      ? "4px 12px 12px 12px"
      : "0"};
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
`;

const ShieldIcon = styled.svg`
  width: 16px;
  height: 16px;
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
`;

const FeeTimeItem = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const GasIcon = styled.svg`
  width: 16px;
  height: 16px;
`;

const TimeIcon = styled.svg`
  width: 16px;
  height: 16px;
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

  background: ${({ aqua }) => (aqua ? "transparent" : COLORS.aqua)};
  color: ${({ aqua }) => (aqua ? COLORS.aqua : "#000000")};

  &:hover {
    ${({ aqua }) =>
      aqua
        ? `background: rgba(108, 249, 216, 0.1);`
        : `
        box-shadow: 0 0 16px 0 ${COLORS.aqua};
        background: ${COLORS.aqua};
      `}
  }

  &:focus {
    ${({ aqua }) => !aqua && `box-shadow: 0 0 16px 0 ${COLORS.aqua};`}
  }

  &:disabled {
    ${({ loading }) => loading && "opacity: 0.6; cursor: wait;"}
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

const RouteIcon = styled.svg`
  width: 20px;
  height: 20px;
`;

const InfoIconSvg = styled.svg`
  width: 20px;
  height: 20px;
`;

const RouteDot = styled.span`
  display: inline-block;
  width: 20px;
  height: 20px;
  background: ${COLORS.aqua};
  border-radius: 50%;
  opacity: 0.8;
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

const SmallInfoIcon = styled(Info)`
  width: 16px;
  height: 16px;
`;

export default ConfirmationButton;
