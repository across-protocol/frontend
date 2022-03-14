import { FC } from "react";
import { Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import {
  StyledSidebar,
  StyledHeader,
  Overlay,
  CloseButton,
  HeaderText,
  ConnectButton,
} from "./Sidebar.styles";
interface Props {
  setOpenSidebar: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar: FC<Props> = ({ setOpenSidebar }) => {
  return (
    <Overlay>
      <StyledSidebar>
        <StyledHeader>
          <CloseButton onClick={() => setOpenSidebar(false)}>X</CloseButton>
          <HeaderText>0xc18BB25b7CC6FAF2365F8aD777aD34C057eE4617</HeaderText>
          <HeaderText>Ethereum Mainnet</HeaderText>
          <ConnectButton>Disconnect</ConnectButton>
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
