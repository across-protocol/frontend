import styled from "@emotion/styled";
import { SecondaryButton } from "components/Button";

export const Overlay = styled.div`
  position: absolute;
  left: 1px;
  right: 1px;
  bottom: 1px;
  height: 144px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(
    360deg,
    #2d2e33 0%,
    rgba(45, 46, 51, 0.65) 79.69%,
    rgba(45, 46, 51, 0) 100%
  );
  border-radius: 8px;
  z-index: 2;

  @media (max-width: 428px) {
    height: 132px;
  }
`;

export const ConnectButton = styled(SecondaryButton)``;
