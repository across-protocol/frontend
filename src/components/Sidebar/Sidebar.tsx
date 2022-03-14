import { Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import {
  StyledSidebar,
  StyledHeader,
  Overlay,
  CloseButton,
  HeaderText,
} from "./Sidebar.styles";
interface Props {}
const Sidebar = () => {
  return (
    <Overlay>
      <StyledSidebar>
        <StyledHeader>
          <CloseButton>X</CloseButton>
          <HeaderText>0xc18BB25b7CC6FAF2365F8aD777aD34C057eE4617</HeaderText>
          <HeaderText>Ethereum Mainnet</HeaderText>
        </StyledHeader>
        {/* <Menu iconShape="square">
        <MenuItem>Dashboard</MenuItem>
        <SubMenu title="Components">
          <MenuItem>Component 1</MenuItem>
          <MenuItem>Component 2</MenuItem>
        </SubMenu>
      </Menu> */}
      </StyledSidebar>
    </Overlay>
  );
};

export default Sidebar;
