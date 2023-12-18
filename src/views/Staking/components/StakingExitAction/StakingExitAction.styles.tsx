import styled from "@emotion/styled";
import { QUERIESV2 } from "utils";

export const IconPairContainer = styled.div`
  padding-right: 4px;
`;

export const Logo = styled.img`
  height: 24px;
  width: 24px;

  @media ${QUERIESV2.sm.andDown} {
    height: 24px;
    width: 24px;
  }
`;

export const Text = styled.span`
  font-weight: 400;
  font-size: 18px;
  line-height: 26px;
  color: #e0f3ff;
`;

export const TitleLogo = styled.div<{ extendWidth: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: ${({ extendWidth }) => (extendWidth ? 18 : 12)}px;

  @media ${QUERIESV2.sm.andDown} {
    gap: 8px;
  }
`;
