import { ProSidebar, SidebarHeader, Menu, MenuItem } from "react-pro-sidebar";

import styled from "@emotion/styled";
import "react-pro-sidebar/dist/css/styles.css";
import { SecondaryButton } from "../Buttons";
import { QUERIES } from "utils";

export const Overlay = styled.div`
  z-index: 50;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-gray-transparent-lighter);
  display: flex;
  justify-content: center;
  align-items: flex-start;
`;

export const StyledSidebar = styled(ProSidebar)`
  position: fixed;
  transition: all 1s ease-in-out;
  top: 0;
  width: 450px;
  transform: translateX(100%);
  right: 0;
  display: block;
  &.closed {
    display: none;
  }
  @media ${QUERIES.tabletAndDown} {
    width: 100%;
    height: 100%;
  }
  &.open {
    right: -450px;
    transform: translateX(-100%);
    @media ${QUERIES.tabletAndDown} {
      right: -100%;
    }
  }
  .pro-sidebar-inner > .pro-sidebar-layout {
    background-color: var(--color-gray-600);
  }
`;

export const StyledHeader = styled(SidebarHeader)`
  background-color: var(--color-primary);
  padding: 1.5rem;
`;

export const CloseButton = styled.div`
  text-align: right;
  color: var(--color-gray);
  font-size: ${20 / 16}rem;
  font-weight: 700;
  cursor: pointer;
  margin-left: auto;
  margin-right: 16px;
  img {
    margin-top: 16px;
    height: 20px;
  }
`;
export const HeaderText = styled.div`
  color: var(--color-gray);
  font-size: ${16 / 16}rem;
`;

export const ConnectButton = styled(SecondaryButton)`
  border: none;
  background-color: inherit;
  cursor: pointer;
  padding: 16px;
  font-size: 1rem;
  border-radius: var(--radius);
  position: relative;
  background-color: var(--color-gray);
  color: var(--color-white);
  padding: 12px 16px;
  border: 1px solid transparent;
`;

export const DisconnectButton = styled(ConnectButton)`
  margin-top: 1.25rem;
`;
export const StyledMenu = styled(Menu)`
  &.pro-menu {
    padding-top: 0;
    padding-bottom: 0;
    a {
      color: var(--color-white);
    }
  }
  background-color: var(--color-gray-550);
`;
interface IStyledMenuItem {
  selected?: boolean;
}
export const StyledMenuItem = styled(MenuItem)<IStyledMenuItem>`
  color: var(--color-white);
  font-weight: ${({ selected }) => (selected ? "600" : "400")};
  padding-left: 0;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-gray-550);
  background-color: ${({ selected }) => {
    return selected ? "var(--color-gray-550)" : "var(--color-gray-600)";
  }};
`;

export const ConnectText = styled.div`
  > div {
    display: inline-block;
    background-color: var(--color-white);
    height: 12px;
    width: 12px;
    margin-right: 4px;
    border-radius: 8px;
    content: " ";
  }
  color: var(--color-gray);
`;

export const TopHeaderRow = styled.div`
  display: flex;
`;
