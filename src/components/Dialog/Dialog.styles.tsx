import styled from "@emotion/styled";
import { DialogContent, DialogOverlay } from "@reach/dialog";
import { COLORS, QUERIES } from "utils";

export const Wrapper = styled(DialogContent)`
  position: relative;
  padding: 20px 25px;
  background-color: var(--color-primary);
  color: var(--color-gray);
  border-radius: 12px;
  max-width: 440px;
  width: min(440px, calc(100% - 20px));
  top: 10vh;
  overflow: auto;
  min-height: 60vh;
  max-height: 80vh;
  @media ${QUERIES.mobileAndDown} {
    top: 25%;
  }
`;

export const CloseButton = styled.button`
  position: absolute;
  top: 0;
  right: 0;
  background-color: transparent;
  padding: 8px;
  border: none;
  cursor: pointer;
`;

export const Overlay = styled(DialogOverlay)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: hsla(${COLORS.gray[500]} / 0.9);
  display: flex;
  justify-content: center;
  align-items: flex-start;
`;
