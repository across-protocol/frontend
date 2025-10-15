import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import { COLORS, QUERIESV2 } from "utils";
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
  height: 100dvh;

  z-index: 99998;

  animation: ${fadeBackground} 0.3s linear;
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
      direction.mobile === "middle"
        ? "center"
        : direction.mobile === "bottom"
          ? "flex-end"
          : "flex-start"};
    padding: ${({ direction }) =>
        direction.mobile === "middle"
          ? "0px"
          : direction.mobile === "bottom"
            ? "16px"
            : "calc(72px+16px)"}
      0px;
  }
`;

type ModalWrapperType = {
  height?: number;
  width?: number;
  topYOffset?: number;
  bottomYOffset?: number;
  padding: "normal" | "thin";
};

// minimum y-axis margin
const minimumMargin = 32;

export const ModalContentWrapper = styled.div<ModalWrapperType>`
  --padding-modal-content: ${({ padding }) =>
    padding === "normal" ? "24px" : "16px"};
  height: ${({ height, topYOffset }) =>
    height
      ? `min(calc(100svh - ${minimumMargin * 2}px - ${topYOffset ?? 0}px), ${height}px)`
      : "calc(100svh - 64px)"};
  max-width: ${({ width }) => width ?? 800}px;
  width: calc(100% - 32px);

  display: flex;
  flex-direction: column;
  align-items: flex-start;

  margin: 0 auto;
  padding: 0;

  margin-top: ${({ topYOffset }) => topYOffset ?? 0}px;
  margin-bottom: ${({ bottomYOffset }) => bottomYOffset ?? 0}px;
  background: #202024;
  border: 1px solid #34353b;
  box-shadow: 0px 8px 32px rgba(0, 0, 0, 0.32);
  border-radius: 24px;

  position: relative;

  overflow: hidden;
`;

export const TitleAndExitWrapper = styled.div`
  display: flex;
  flex-direction: row;

  justify-content: space-between;
  align-items: center;

  gap: 12px;
  padding-bottom: var(--padding-modal-content);

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

export const ElementRowDivider = styled.div`
  height: 1px;
  min-height: 1px;
  background: #34353b;

  margin-left: calc(0px - var(--padding-modal-content));
  width: calc(100% + (2 * var(--padding-modal-content)));
`;

export const CloseButton = styled.button`
  border: none;
  background-color: transparent;
  display: inline-flex;
  outline: none;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    background-color: ${COLORS["grey-400-15"]};
  }

  &:focus-visible {
    outline: 2px solid ${COLORS.aqua};
  }
`;

export const ModalHeader = styled.div`
  position: sticky;
  top: 0;
  z-index: 10;
  background: #202024;
  padding: var(--padding-modal-content);
  padding-bottom: 0;
  flex-shrink: 0;
  width: 100%;
`;

export const ModalContent = styled.div<{ noScroll?: boolean }>`
  flex: 1;
  overflow: ${({ noScroll }) => (noScroll ? "hidden" : "hidden scroll")};
  padding: var(--padding-modal-content);
  min-height: 0;
  width: 100%;
`;

export const ModalFooter = styled.div`
  position: sticky;
  bottom: 0;
  z-index: 10;
  background: #202024;
  padding: var(--padding-modal-content);
  padding-top: 0;
  flex-shrink: 0;
`;
