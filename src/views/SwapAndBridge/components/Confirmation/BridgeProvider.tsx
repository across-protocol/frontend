import styled from "@emotion/styled";
import React from "react";
import { BridgeProvider, getProviderDisplay } from "./provider";
import { Tooltip } from "../../../../components/Tooltip";

export const ProviderBadge = ({
  provider,
  expanded,
}: {
  provider: BridgeProvider;
  expanded: boolean;
}) => {
  const { label, logo } = getProviderDisplay(provider);
  return expanded ? (
    <ProviderBadgeWrapper provider={provider}>
      {logo}
      {label}
    </ProviderBadgeWrapper>
  ) : (
    <Tooltip
      tooltipAnchorHeight="inherit"
      paddingPx={8}
      tooltipId={`tooltip-${provider}`}
      body={
        <ToolipContent>
          {logo}
          {label}
        </ToolipContent>
      }
    >
      <LogoWrapper>{logo}</LogoWrapper>
    </Tooltip>
  );
};

const LogoWrapper = styled.div`
  display: flex;
  height: 100%;
  justify-content: center;
`;
const ToolipContent = styled.div`
  display: flex;
  flex-direction: row;
  gap: 6px;
  align-items: center;
  justify-content: space-between;
`;
const ProviderBadgeWrapper = styled.span<{ provider: BridgeProvider }>`
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  gap: 6px;
`;
