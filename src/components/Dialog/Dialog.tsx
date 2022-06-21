import React from "react";
import { X } from "react-feather";
import { Overlay, Wrapper, CloseButton, Content } from "./Dialog.styles";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const Dialog: React.FC<Props> = ({ isOpen, onClose, children }) => (
  <Overlay isOpen={isOpen}>
    <Wrapper aria-label="dialog">
      <CloseButton onClick={onClose}>
        <X />
      </CloseButton>
      <Content>{children}</Content>
    </Wrapper>
  </Overlay>
);

export default Dialog;
