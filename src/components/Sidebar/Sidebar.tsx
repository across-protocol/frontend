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
import { getChainInfo, isSupportedChainId } from "utils";
import useSidebar from "./useSidebar";
import closeIcon from "assets/across-close-button.svg";
import { useConnection } from "state/hooks";

interface Props {
  openSidebar: boolean;
  setOpenSidebar: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar: FC<Props> = ({ openSidebar, setOpenSidebar }) => {
  const { account, ensName, isConnected, chainId, location, className } =
    useSidebar(openSidebar);
  const { connect, disconnect, wallet } = useConnection();
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
              <ConnectButton onClick={() => connect()}>
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
          {isSupportedChainId(chainId) && isConnected ? (
            <HeaderText>{getChainInfo(chainId).name}</HeaderText>
          ) : (
            <HeaderText>Unsupported Network</HeaderText>
          )}
          {isConnected && wallet ? (
            <DisconnectButton onClick={() => disconnect(wallet)}>
              Disconnect
            </DisconnectButton>
          ) : null}
        </StyledHeader>
        <StyledMenu>
          <StyledMenuItem selected={location.pathname === "/"}>
            <Link
              onClick={() => onClickLink()}
              to={{ pathname: "/", search: location.search }}
            >
              Bridge
            </Link>
          </StyledMenuItem>
          <StyledMenuItem selected={location.pathname === "/pool"}>
            <Link
              onClick={() => onClickLink()}
              to={{ pathname: "/pool", search: location.search }}
            >
              Pool
            </Link>
          </StyledMenuItem>
          <StyledMenuItem selected={location.pathname === "/transactions"}>
            <Link
              onClick={() => onClickLink()}
              to={{ pathname: "/transactions", search: location.search }}
            >
              Transactions
            </Link>
          </StyledMenuItem>
          <StyledMenuItem selected={location.pathname === "/rewards"}>
            <Link
              onClick={() => onClickLink()}
              to={{ pathname: "/rewards", search: location.search }}
            >
              Rewards
            </Link>
          </StyledMenuItem>
          <StyledMenuItem selected={location.pathname === "/about"}>
            <Link
              onClick={() => onClickLink()}
              to={{ pathname: "/about", search: location.search }}
            >
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
