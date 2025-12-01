import styled from "@emotion/styled";
import React from "react";
import { BridgeProvider, getProviderDisplay } from "./provider";

export const ProviderBadge = ({
  provider,
  expanded,
}: {
  provider: BridgeProvider;
  expanded: boolean;
}) => {
  const { label, logo } = getProviderDisplay(provider);
  return (
    <ProviderBadgeWrapper provider={provider}>
      {logo}
      {expanded && label}
    </ProviderBadgeWrapper>
  );
};

const ProviderBadgeWrapper = styled.span<{ provider: BridgeProvider }>`
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  gap: 6px;
`;
