import React from "react";
import { DialogOverlay, DialogContent } from "@reach/dialog";
import styled from "@emotion/styled";
import { COLORS } from "utils";

type MobileMenuProps = {
  isOpen: boolean;
};

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, children }) => {
  return (
    <Overlay isOpen={isOpen}>
      <Content aria-label="Menu">{children}</Content>
    </Overlay>
  );
};

export default MobileMenu;

export const Overlay = styled(DialogOverlay)`
  position: fixed;
  top: var(--header-height);
  left: 0;
  right: 0;
  bottom: 0;
  background-color: hsla(${COLORS.gray[500]} / 0.9);
`;

const Content = styled(DialogContent)`
  padding: 10px;
`;
