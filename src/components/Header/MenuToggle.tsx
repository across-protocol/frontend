import { FC } from "react";
import styled from "@emotion/styled";
import { ReactComponent as HamburgerIcon } from "assets/icons/hamburger.svg";

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
  position: relative;
  width: 40px;
  height: 40px;
  padding: 0;
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: transparent;
  border: 1px solid #4c4e57;
  border-radius: 20px;
  cursor: pointer;
  outline: none;

  :hover {
    border: 1px solid #e0f3ff;

    svg rect {
      fill: #e0f3ff;
    }
  }
`;
