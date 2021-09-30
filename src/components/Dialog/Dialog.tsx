import React from "react";
import styled from "@emotion/styled";
import { DialogContent, DialogOverlay } from "@reach/dialog";
import { COLORS } from "../../utils";
import { X } from "react-feather";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const Dialog: React.FC<Props> = ({ isOpen, onClose, children }) => (
  <Overlay isOpen={isOpen}>
    <Wrapper>
      <CloseButton onClick={onClose}>
        <X />
      </CloseButton>
      <div>{children}</div>
    </Wrapper>
  </Overlay>
);

export default Dialog;

const CloseButton = styled.button`
  background-color: transparent;
  padding: 8px;
  position: absolute;
  top: 0;
  right: 0;
  border: none;
`;

const Overlay = styled(DialogOverlay)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: hsla(${COLORS.gray} / 0.9);
`;

const Wrapper = styled(DialogContent)`
  margin: 0 auto;
  padding: 20px 25px;
  position: relative;
  top: 20%;
  bottom: 50%;
  background-color: var(--primary);
  color: var(--gray);
  border-radius: 12px;
  max-width: 440px;
  width: 440px;
`;
