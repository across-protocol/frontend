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
  const { account, ensName, isConnected, chainId, location, className } =
    useSidebar(openSidebar);
  const addrOrEns = ensName ?? account;

  const onClickLink = () => {
    setOpenSidebar(false);
  };

  return (
    <>
      {openSidebar && <Overlay />}
      <StyledSidebar className={className}>
        <StyledHeader>
          <TopHeaderRow>
            {!isConnected && (
              <ConnectButton onClick={() => init()}>
                Connect Wallet
              </ConnectButton>
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
          {addrOrEns && <HeaderText>{addrOrEns}</HeaderText>}
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
            <Link onClick={() => onClickLink()} to="/">
              Bridge
            </Link>
          </StyledMenuItem>
          <StyledMenuItem selected={location.pathname === "/pool"}>
            <Link onClick={() => onClickLink()} to="/pool">
              Pool
            </Link>
          </StyledMenuItem>
          <StyledMenuItem selected={location.pathname === "/transactions"}>
            <Link onClick={() => onClickLink()} to="/transactions">
              Transactions
            </Link>
          </StyledMenuItem>
          <StyledMenuItem selected={location.pathname === "/rewards"}>
            <Link onClick={() => onClickLink()} to="/rewards">
              Rewards
            </Link>
          </StyledMenuItem>
          <StyledMenuItem selected={location.pathname === "/about"}>
            <Link onClick={() => onClickLink()} to="/about">
              About
            </Link>
          </StyledMenuItem>
          <StyledMenuItem>
            <a
              href="https://docs.across.to/bridge/"
              target="_blank"
              rel="noreferrer"
              onClick={() => onClickLink()}
            >
              Docs
            </a>
          </StyledMenuItem>
          <StyledMenuItem>
            <a
              href="https://discord.com/invite/across"
              target="_blank"
              rel="noreferrer"
              onClick={() => onClickLink()}
            >
              Support (Discord)
            </a>
          </StyledMenuItem>
          <StyledMenuItem>
            <a
              href="https://github.com/across-protocol"
              target="_blank"
              rel="noreferrer"
              onClick={() => onClickLink()}
            >
              Github
            </a>
          </StyledMenuItem>
          <StyledMenuItem>
            <a
              href="https://twitter.com/AcrossProtocol/"
              target="_blank"
              rel="noreferrer"
              onClick={() => onClickLink()}
            >
              Twitter
            </a>
          </StyledMenuItem>
          <StyledMenuItem>
            <a
              href="https://medium.com/across-protocol"
              target="_blank"
              rel="noreferrer"
              onClick={() => onClickLink()}
            >
              Medium
            </a>
          </StyledMenuItem>
          <StyledMenuItem>
            <a
              href="https://forum.across.to/"
              target="_blank"
              rel="noreferrer"
              onClick={() => onClickLink()}
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
