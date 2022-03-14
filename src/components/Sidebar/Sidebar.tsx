import { FC } from "react";
import {
  StyledSidebar,
  StyledHeader,
  Overlay,
  CloseButton,
  HeaderText,
  ConnectButton,
  StyledMenu,
  StyledMenuItem,
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
        <StyledMenu>
          <StyledMenuItem>Bridge</StyledMenuItem>
          <StyledMenuItem>Pool</StyledMenuItem>
          <StyledMenuItem selected={true}>Transactions</StyledMenuItem>
          <StyledMenuItem>About</StyledMenuItem>
          <StyledMenuItem>Docs</StyledMenuItem>
          <StyledMenuItem>Support (Discord)</StyledMenuItem>
          <StyledMenuItem>Github</StyledMenuItem>
          <StyledMenuItem>Twitter</StyledMenuItem>
          <StyledMenuItem>Medium</StyledMenuItem>
        </StyledMenu>
      </StyledSidebar>
    </Overlay>
  );
};

export default Sidebar;
