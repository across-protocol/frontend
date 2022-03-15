import { FC } from "react";
import { Link } from "react-router-dom";
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
import useSidebar from "./useSidebar";
const { init, reset } = onboard;

interface Props {
  openSidebar: boolean;
  setOpenSidebar: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar: FC<Props> = ({ openSidebar, setOpenSidebar }) => {
  const { account, isConnected, chainId, location } = useSidebar();

  return (
    <>
      {openSidebar && <Overlay />}
      <StyledSidebar className={openSidebar ? "open" : ""}>
        <StyledHeader>
          <CloseButton onClick={() => setOpenSidebar(false)}>X</CloseButton>
          <ConnectText isConnected={isConnected}>
            <div /> {isConnected ? "Connected" : "Disconnected"}
          </ConnectText>
          {account && <HeaderText>{account}</HeaderText>}
          {chainId && isConnected && (
            <HeaderText>{CHAINS[chainId].name}</HeaderText>
          )}
          <ConnectButton onClick={() => (isConnected ? reset() : init())}>
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
          <StyledMenuItem>
            <a
              href="https://docs.across.to/bridge/"
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpenSidebar(false)}
            >
              Docs
            </a>
          </StyledMenuItem>
          <StyledMenuItem>
            <a
              href="https://discord.com/invite/across"
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpenSidebar(false)}
            >
              Support (Discord)
            </a>
          </StyledMenuItem>
          <StyledMenuItem>
            <a
              href="https://github.com/across-protocol"
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpenSidebar(false)}
            >
              Github
            </a>
          </StyledMenuItem>
          <StyledMenuItem>
            <a
              href="https://twitter.com/AcrossProtocol/"
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpenSidebar(false)}
            >
              Twitter
            </a>
          </StyledMenuItem>
          <StyledMenuItem>
            <a
              href="https://medium.com/across-protocol"
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpenSidebar(false)}
            >
              Medium
            </a>
          </StyledMenuItem>
        </StyledMenu>
      </StyledSidebar>
    </>
  );
};

export default Sidebar;
