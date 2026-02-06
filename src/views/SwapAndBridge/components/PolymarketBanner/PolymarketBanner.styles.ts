import styled from "@emotion/styled";
import { COLORS, QUERIESV2 } from "utils";

export const BannerWrapper = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #0f1a2b 0%, #0a1420 100%);
  border-radius: 12px;
  border: 1px solid #1e3a5f;
  width: 100%;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 8px;

  &:hover {
    border-color: #2d5a8f;
    background: linear-gradient(135deg, #142030 0%, #0d1825 100%);
  }

  @media ${QUERIESV2.sm.andDown} {
    padding: 12px;
    gap: 10px;
  }
`;

export const BannerHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

export const LogoIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #1a5cff;
  border-radius: 6px;
  flex-shrink: 0;
`;

export const PolymarketLogo = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: white;
`;

export const BannerBrandText = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${COLORS["white-100"]};
`;

export const BannerContent = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
`;

export const SendIconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(26, 92, 255, 0.15);
  border-radius: 10px;
  flex-shrink: 0;

  @media ${QUERIESV2.sm.andDown} {
    width: 36px;
    height: 36px;
  }
`;

export const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
`;

export const BannerTitle = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${COLORS["white-100"]};
  line-height: 1.3;
`;

export const BannerSubtitle = styled.span`
  font-size: 12px;
  font-weight: 400;
  color: ${COLORS["grey-400"]};
  line-height: 1.3;
`;

export const ModalWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

export const ModalInstruction = styled.p`
  font-size: 14px;
  font-weight: 400;
  color: ${COLORS["grey-400"]};
  line-height: 1.5;
  margin: 0;
`;

export const ModalLink = styled.a`
  color: ${COLORS.aqua};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

export const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  margin-top: 8px;
`;
