import styled from "@emotion/styled";
import { DialogContent, DialogOverlay } from "@reach/dialog";
import { COLORS } from "utils";

export const Overlay = styled(DialogOverlay)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: hsla(${COLORS.gray[500]} / 0.9);
  display: flex;
  padding: 20px;
`;

export const Content = styled.div`
  padding: 10px 25px;
  width: 100%;
  overflow: auto;

  ::-webkit-scrollbar {
    width: 6px;
  }

  ::-webkit-scrollbar-track {
    background-color: var(--color-primary);
  }

  ::-webkit-scrollbar-thumb {
    background-color: var(--color-gray-300);
    border-radius: 5px;
    box-shadow: inset 0 0 0 1px var(--color-primary);
  }
`;

export const Wrapper = styled(DialogContent)`
  position: relative;
  display: flex;
  margin: auto;
  padding: 10px 0;
  background-color: var(--color-primary);
  color: var(--color-gray);
  outline: none;
  border-radius: 12px;
  max-width: 440px;
  max-height: 100%;
  min-width: min(440px, calc(100% - 20px));
`;

export const CloseButton = styled.button`
  position: absolute;
  top: 0;
  right: 0;
  color: var(--color-gray);
  background-color: transparent;
  padding: 8px;
  border: none;
  outline: none;
  cursor: pointer;
`;
