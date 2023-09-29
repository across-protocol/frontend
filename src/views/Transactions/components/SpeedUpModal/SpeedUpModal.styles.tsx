import styled from "@emotion/styled";
import { DialogContent, DialogOverlay } from "@reach/dialog";

import { ButtonV2 } from "components/Buttons";

export const Overlay = styled(DialogOverlay)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100000;
  overflow-y: scroll;
`;

export const Content = styled(DialogContent)`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  background-color: #202024;
  border: 1px solid #34353b;
  border-radius: 16px;
  width: 482px;
`;

export const SuccessContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding-bottom: 24px;

  svg {
    stroke: #6cf9d8;
    fill: #6cf9d8;
  }
`;

export const Title = styled.h1`
  font-size: ${22 / 16}rem;
  line-height: ${26 / 16}rem;
  font-weight: 400;
`;

export const InfoBox = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 16px;
  background-color: rgba(249, 210, 108, 0.05);
  border: 1px solid rgba(249, 210, 108, 0.15);
  border-radius: 12px;

  svg {
    height: 24px;
    width: 24px;
    stroke: #f9d26c;
    margin-right: 14px;
  }

  p {
    font-size: ${16 / 16}rem;
    line-height: ${20 / 16}rem;
    font-weight: 400;
    color: #f9d26c;
  }
`;

export const ErrorBox = styled(InfoBox)`
  background-color: #f96c6c25;
  border: 1px solid #f96c6c5a;

  button {
    background-color: inherit;
    font-size: inherit;
    color: inherit;
    text-decoration: underline;
    cursor: pointer;
    border: none;
    padding: 0;
    margin: 0;
  }

  svg {
    stroke: #f96c6c;
  }

  p {
    color: #f96c6c;
  }
`;

export const ButtonsRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
`;

export const CloseHeaderRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
`;

export const ConfirmButton = styled(ButtonV2)<{ warning?: boolean }>`
  border: 1px solid ${({ warning }) => (warning ? "#f9d26c" : "#6cf9d8")};
  border-radius: 20px;
  background-color: transparent;
  color: ${({ warning }) => (warning ? "#f9d26c" : "#6cf9d8")};
`;

export const CancelButton = styled(ButtonV2)`
  background-color: transparent;
  color: #9daab2;
  border: none;
  :active {
    ::after {
      border: none;
    }
  }
`;

export const SpeedUpTxLinkContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;

  a {
    text-decoration: underline;
    color: #9daab2;
  }
`;
