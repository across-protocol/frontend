import { ProSidebar, SidebarHeader } from "react-pro-sidebar";
import styled from "@emotion/styled";
import "react-pro-sidebar/dist/css/styles.css";

export const Overlay = styled.div`
  z-index: 10000;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: hsla(230deg 6% 19% / 0.9);
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
  right: 0;
  top: 0;
`;

export const StyledHeader = styled(SidebarHeader)`
  background-color: var(--color-primary);
`;
