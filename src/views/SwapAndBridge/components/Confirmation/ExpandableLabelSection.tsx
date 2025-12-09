// Expandable label section component
import React from "react";
import { PriceImpact } from "../../utils/fees";
import { BridgeProvider } from "./provider";
import { ProviderBadge } from "./BridgeProvider";
import { AnimatePresence, motion } from "framer-motion";
import { BridgeButtonState, FreeTag } from "./ConfirmationButton";
import styled from "@emotion/styled";
import { COLORS } from "../../../../utils";
import { ReactComponent as ChevronDownIcon } from "assets/icons/chevron-down.svg";
import { ReactComponent as Across } from "assets/token-logos/acx.svg";
import { ReactComponent as Shield } from "assets/icons/shield.svg";
import { ReactComponent as Dollar } from "assets/icons/dollar.svg";
import { ReactComponent as Time } from "assets/icons/time.svg";
import { ReactComponent as Warning } from "assets/icons/warning_triangle_filled.svg";

export const ExpandableLabelSection: React.FC<
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

const ExpandableLabelRightAccent = styled(ExpandableLabelLeft)`
  text-align: right;
  justify-content: flex-end;
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

const FeeTimeItem = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 130%;
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
