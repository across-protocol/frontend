import styled from "@emotion/styled";
import { COLORS } from "../../../../utils";
import { SwapApprovalApiCallReturnType } from "../../../../utils/serverless-api/prod/swap-approval";
import React from "react";
import { ReactComponent as Across } from "assets/token-logos/acx.svg";

export type BridgeProvider =
  | "across"
  | "hypercore"
  | "cctp"
  | "oft"
  | "sponsored-intent";

export const PROVIDER_DISPLAY: Record<
  BridgeProvider,
  { name: string; label: string }
> = {
  across: { name: "Across", label: "Across V4" },
  cctp: { name: "CCTP", label: "Circle CCTP" },
  oft: { name: "OFT", label: "LayerZero OFT" },
  hypercore: { name: "HC", label: "Hypercore" },
  "sponsored-intent": { name: "Intent", label: "Sponsored Intent" },
};

export const PROVIDER_COLORS: Record<BridgeProvider, string> = {
  across: COLORS.aqua,
  cctp: "#3B82F6",
  oft: "#8B5CF6",
  "sponsored-intent": "#F59E0B",
  hypercore: "#bada55",
};

export const getProviderFromQuote = (
  swapQuote: SwapApprovalApiCallReturnType | null
) => (swapQuote?.steps.bridge.provider || "across") as BridgeProvider;

export const getProviderDisplay = (provider: BridgeProvider) =>
  PROVIDER_DISPLAY[provider] || PROVIDER_DISPLAY.across;

export const ProviderBadge = ({
  provider,
  expanded,
}: {
  provider: BridgeProvider;
  expanded: boolean;
}) => {
  const { label, name } = PROVIDER_DISPLAY[provider];
  return (
    <ProviderBadgeWrapper provider={provider}>
      {expanded ? (
        <>
          {provider === "across" && <Across width="16px" height="16px" />}
          {label}
        </>
      ) : (
        <>
          {provider === "across" ? (
            <Across width="16px" height="16px" />
          ) : (
            label
          )}
        </>
      )}
    </ProviderBadgeWrapper>
  );
};

const ProviderBadgeWrapper = styled.span<{ provider: BridgeProvider }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  background: ${({ provider }) => `${PROVIDER_COLORS[provider]}20`};
  color: ${({ provider }) => PROVIDER_COLORS[provider]};
`;
