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
      {label}
      {logo}
    </ProviderBadgeWrapper>
  ) : (
    <Tooltip
      paddingPx={8}
      tooltipId={`tooltip-${provider}`}
      body={
        <ToolipContent>
          {logo}
          {label}
        </ToolipContent>
      }
    >
      {logo}
    </Tooltip>
  );
};

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
