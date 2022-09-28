import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import { ReactComponent as CrossIcon } from "assets/icons/cross.svg";
import { QUERIESV2 } from "utils";
import { ModalDirection } from "./Modal";

const fadeBackground = keyframes`
  from {background-color: rgba(0, 0, 0, 0)}
  to {background-color: rgba(0, 0, 0, 0.6)}
`;

type WrapperType = {
  reverseAnimation?: boolean;
  direction: ModalDirection;
};
export const Wrapper = styled.div<WrapperType>`
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;

  display: flex;
  justify-content: center;

  width: 100vw;
  height: 100vh;

  z-index: 999998;

  animation: ${fadeBackground} 0.5s linear;
  animation-fill-mode: forwards;

  opacity: ${({ reverseAnimation }) => (reverseAnimation ? 0 : 1)};
  transition: opacity 0.5s;

  align-items: ${({ direction }) =>
    direction.desktop === "middle"
      ? "center"
      : direction.desktop === "bottom"
      ? "flex-end"
      : "flex-start"};
  padding: ${({ direction }) =>
      direction.desktop === "middle"
        ? "0px"
        : direction.desktop === "bottom"
        ? "16px"
        : "calc(72px+16px)"}
    0px;

  @media ${QUERIESV2.tb.andDown} {
    align-items: ${({ direction }) =>
      direction.tablet === "middle"
        ? "center"
        : direction.tablet === "bottom"
        ? "flex-end"
        : "flex-start"};
    padding: ${({ direction }) =>
        direction.tablet === "middle"
          ? "0px"
          : direction.tablet === "bottom"
          ? "16px"
          : "calc(72px+16px)"}
      0px;
  }

  @media ${QUERIESV2.sm.andDown} {
    align-items: ${({ direction }) =>
      direction.tablet === "middle"
        ? "center"
        : direction.tablet === "bottom"
        ? "flex-end"
        : "flex-start"};
    padding: ${({ direction }) =>
        direction.tablet === "middle"
          ? "0px"
          : direction.tablet === "bottom"
          ? "16px"
          : "calc(72px+16px)"}
      0px;
  }
`;

type ModalWrapperType = {
  height?: number;
  width?: number;
};
export const ModalContentWrapper = styled.div<ModalWrapperType>`
  max-height: ${({ height }) => height ?? 400}px;
  max-width: ${({ width }) => width ?? 800}px;

  height: fit-content;
  width: calc(100% - 32px);

  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 24px;

  margin: 0 auto;
  padding: 24px;

  background: #202024;
  border: 1px solid #34353b;
  box-shadow: 0px 8px 32px rgba(0, 0, 0, 0.32);
  border-radius: 16px;
`;

export const TitleAndExitWrapper = styled.div`
  display: flex;
  flex-direction: row;

  justify-content: space-between;
  align-items: center;

  gap: 12px;
  padding: 0px;

  width: 100%;
`;

export const Title = styled.p`
  font-size: 22px;
  line-height: 26px;
  color: #e0f3ff;

  @media ${QUERIESV2.tb.andDown} {
    font-size: 18px;
    line-height: 26px;
  }
`;

export const StyledExitIcon = styled(CrossIcon)`
  cursor: pointer;
`;
