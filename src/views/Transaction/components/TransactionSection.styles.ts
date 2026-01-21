import styled from "@emotion/styled";
import { COLORS, QUERIESV2 } from "utils";

export const SectionCard = styled.div`
  --padding: 16px;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  background: ${COLORS["bright-gray-t-5"]};
  width: 100%;
  overflow: hidden;
`;

export const SectionHeader = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 12px var(--padding);
  background: ${COLORS["bright-gray-t-5"]};
`;

export const DetailRowGroup = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: var(--padding);
  border-top: 1px solid ${COLORS["base-dark-gray"]};

  @media ${QUERIESV2.sm.andDown} {
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const DetailRowItem = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 8px;

  @media ${QUERIESV2.sm.andDown} {
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const HeaderRight = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  color: ${COLORS["base-bright-gray"]};
  text-overflow: ellipsis;
  text-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 130%;
`;

export const ChainBadge = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

export const ExplorerLinkButton = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  color: inherit;

  svg {
    width: 16px;
    height: 16px;
    transition: color 0.2s ease;
  }

  &:hover {
    background: ${COLORS["grey-600"]};
    svg {
      color: ${COLORS.aqua};
    }
  }
`;

export const ChainIcon = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
`;

export const TokenIcon = styled.img`
  width: 16px;
  height: 16px;
  border-radius: 50%;
`;

export const TokenDisplay = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;
