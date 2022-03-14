import { FC } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  StyledSidebar,
  StyledHeader,
  Overlay,
  CloseButton,
  HeaderText,
  ConnectButton,
  StyledMenu,
  StyledMenuItem,
  ConnectText,
} from "./Sidebar.styles";
import { onboard, CHAINS } from "utils";
import { useConnection } from "state/hooks";

const { init, reset } = onboard;

interface Props {
  setOpenSidebar: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar: FC<Props> = ({ setOpenSidebar }) => {
  const { account, isConnected, chainId } = useConnection();
  const location = useLocation();
  console.log("location", location);
  return (
    <Overlay>
      <StyledSidebar>
        <StyledHeader>
          <CloseButton onClick={() => setOpenSidebar(false)}>X</CloseButton>
          <ConnectText isConnected={isConnected}>
            <div /> {isConnected ? "Connected" : "Disconnected"}
          </ConnectText>
          {account && <HeaderText>{account}</HeaderText>}
          {chainId && isConnected && (
            <HeaderText>{CHAINS[chainId].name}</HeaderText>
          )}
          <ConnectButton
            onClick={() => {
              if (isConnected) {
                return reset();
              } else {
                return init();
              }
            }}
          >
            {isConnected ? "Disconnect" : "Connect wallet"}
          </ConnectButton>
        </StyledHeader>
        <StyledMenu>
          <StyledMenuItem selected={location.pathname === "/"}>
            <Link onClick={() => setOpenSidebar(false)} to="/">
              Bridge
            </Link>
          </StyledMenuItem>
          <StyledMenuItem selected={location.pathname === "/pool"}>
            <Link onClick={() => setOpenSidebar(false)} to="/pool">
              Pool
            </Link>
          </StyledMenuItem>
          <StyledMenuItem selected={location.pathname === "/transactions"}>
            <Link onClick={() => setOpenSidebar(false)} to="/transactions">
              Transactions
            </Link>
          </StyledMenuItem>
          <StyledMenuItem selected={location.pathname === "/about"}>
            <Link onClick={() => setOpenSidebar(false)} to="/about">
              About
            </Link>
          </StyledMenuItem>
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
