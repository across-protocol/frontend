import { FC } from "react";
import styled from "@emotion/styled";
import { ReactComponent as HamburgerIcon } from "assets/icons/hamburger.svg";
import { COLORS } from "utils";

interface MenuToggleProps {
  toggle: () => void;
}

const MenuToggle: FC<MenuToggleProps> = ({ toggle }) => {
  return (
    <CloseButton onClick={() => toggle()}>
      <HamburgerIcon />
    </CloseButton>
  );
};

export default MenuToggle;

const CloseButton = styled.button`
  cursor: pointer;

  display: flex;
  width: 40px;
  height: 40px;
  justify-content: center;
  align-items: center;
  gap: 6px;

  border-radius: 12px;
  border: 1px solid ${COLORS["grey-500"]};
  background: #2d2e33;

  :hover {
    border: 1px solid #e0f3ff;

    svg rect {
      fill: #e0f3ff;
    }
  }
`;
