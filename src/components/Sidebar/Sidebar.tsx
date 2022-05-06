import { FC } from "react";
import { Link } from "react-router-dom";
import {
  StyledSidebar,
  StyledHeader,
  Overlay,
  CloseButton,
  HeaderText,
  ConnectButton,
  DisconnectButton,
  StyledMenu,
  StyledMenuItem,
  ConnectText,
  TopHeaderRow,
} from "./Sidebar.styles";
import { onboard, getChainInfo } from "utils";
import useSidebar from "./useSidebar";
import closeIcon from "assets/across-close-button.svg";
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
          <TopHeaderRow>
            {!isConnected && (
              <ConnectButton onClick={() => init()}>Connect</ConnectButton>
            )}
            {isConnected && (
              <ConnectText>
                <div /> Connected
              </ConnectText>
            )}
            <CloseButton onClick={() => setOpenSidebar(false)}>
              <img src={closeIcon} alt="close_button" />
            </CloseButton>
          </TopHeaderRow>
          {account && <HeaderText>{account}</HeaderText>}
          {chainId && isConnected && (
            <HeaderText>{getChainInfo(chainId).name}</HeaderText>
          )}
          {isConnected && (
            <DisconnectButton onClick={() => reset()}>
              Disconnect
            </DisconnectButton>
          )}
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
          <StyledMenuItem>
            <a
              href="https://forum.across.to/"
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpenSidebar(false)}
            >
              Discourse
            </a>
          </StyledMenuItem>
        </StyledMenu>
      </StyledSidebar>
    </>
  );
};

export default Sidebar;
