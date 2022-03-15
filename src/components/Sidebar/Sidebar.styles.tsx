import { ProSidebar, SidebarHeader, Menu, MenuItem } from "react-pro-sidebar";

import styled from "@emotion/styled";
import "react-pro-sidebar/dist/css/styles.css";
import { SecondaryButton } from "../Buttons";

export const Overlay = styled.div`
  z-index: 500;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-gray-lighter);
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: center;
  -ms-flex-pack: center;
  -webkit-justify-content: center;
  justify-content: center;
  -webkit-align-items: flex-start;
  -webkit-box-align: flex-start;
  -ms-flex-align: flex-start;
  align-items: flex-start;
`;

export const StyledSidebar = styled(ProSidebar)`
  position: absolute;
  transition: all 0.5s ease-in-out;
  right: -450px;
  top: 0;
  width: 450px;
  transform: translateX(50px);
  &.open {
    transform: translateX(-450px);
  }
  .pro-sidebar-inner > .pro-sidebar-layout {
    background-color: var(--color-gray-600);
  }
`;

export const StyledHeader = styled(SidebarHeader)`
  background-color: var(--color-primary);
  padding: 1rem;
`;

export const CloseButton = styled.div`
  text-align: right;
  color: var(--color-gray);
  font-size: ${24 / 16}rem;
  font-weight: 700;
  cursor: pointer;
  width: 25px;
  margin-left: auto;
`;
export const HeaderText = styled.div`
  color: var(--color-gray);
  font-size: ${16 / 16}rem;
`;

export const ConnectButton = styled(SecondaryButton)`
  padding: 6px 16px;
  height: 40px;
  width: 154px;
  border: 1px solid transparent;
  margin-top: 1.25rem;
  font-size: ${14 / 16}rem;
`;
export const StyledMenu = styled(Menu)`
  &.pro-menu {
    padding-top: 0;
    padding-bottom: 0;
    a {
      color: var(--color-white);
    }
  }
  background-color: var(--color-gray-700);
`;
interface IStyledMenuItem {
  selected?: boolean;
}
export const StyledMenuItem = styled(MenuItem)<IStyledMenuItem>`
  color: var(--color-white);
  font-weight: 600;
  padding-left: 1rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-gray-700);
  background-color: ${({ selected }) => {
    return selected ? "var(--color-gray-700)" : "var(--color-gray-600)";
  }};
`;

interface IConnectedText {
  isConnected?: boolean;
}
export const ConnectText = styled.div<IConnectedText>`
  > div {
    display: inline-block;
    background-color: ${({ isConnected }) =>
      isConnected ? "var(--color-white)" : "var(--color-gray)"};
    height: 12px;
    width: 12px;
    margin-right: 4px;
    border-radius: 8px;
    content: " ";
  }
  color: var(--color-gray);
`;
