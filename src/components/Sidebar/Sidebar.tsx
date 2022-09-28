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
import { useConnection } from "hooks";

interface Props {
  openSidebar: boolean;
  setOpenSidebar: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar: FC<Props> = ({ openSidebar, setOpenSidebar }) => {
  const {
    sidebarNavigationLinks,
    account,
    ensName,
    isConnected,
    chainId,
    location,
    className,
  } = useSidebar(openSidebar);
  const { connect, disconnect, wallet } = useConnection();
  const addrOrEns = ensName ?? account;

  const onClickLink = () => {
    setOpenSidebar(false);
  };

  const onClickOverlay = () => {
    setOpenSidebar(false);
  };

  return (
    <>
      {openSidebar && <Overlay onClick={() => onClickOverlay()} />}
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
          {isSupportedChainId(chainId) ? (
            <HeaderText>{getChainInfo(chainId).name}</HeaderText>
          ) : isConnected ? (
            <HeaderText>Unsupported Network</HeaderText>
          ) : null}
          {isConnected && wallet ? (
            <DisconnectButton onClick={() => disconnect(wallet)}>
              Disconnect
            </DisconnectButton>
          ) : null}
        </StyledHeader>
        <StyledMenu>
          {sidebarNavigationLinks.map((item, idx) => (
            <StyledMenuItem
              selected={location.pathname === item.pathName}
              key={idx}
            >
              {item.isExternalLink ? (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => onClickLink()}
                >
                  {item.title}
                </a>
              ) : (
                <Link
                  onClick={() => onClickLink()}
                  to={{ pathname: item.pathName, search: location.search }}
                >
                  {item.title}
                </Link>
              )}
            </StyledMenuItem>
          ))}
        </StyledMenu>
      </StyledSidebar>
    </>
  );
};

export default Sidebar;
