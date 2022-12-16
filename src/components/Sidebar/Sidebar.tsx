import { FC } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp } from "react-feather";
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
  AccordionContainer,
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
    sidebarAboutLinks,
    account,
    ensName,
    isConnected,
    chainId,
    location,
    className,
    toggleAboutAccordion,
    setIsAboutAccordionOpen,
    isAboutAccordionOpen,
  } = useSidebar(openSidebar);
  const { connect, disconnect, wallet } = useConnection();
  const addrOrEns = ensName ?? account;

  const onClickLink = () => {
    setOpenSidebar(false);
    setIsAboutAccordionOpen(false);
  };

  const onClickOverlay = () => {
    setOpenSidebar(false);
    setIsAboutAccordionOpen(false);
  };

  return (
    <>
      {openSidebar && <Overlay onClick={() => onClickOverlay()} />}
      <StyledSidebar className={className}>
        <StyledHeader>
          <TopHeaderRow>
            {!isConnected && (
              <ConnectButton
                onClick={() => {
                  connect({ trackSection: "mobileNavSidebar" });
                }}
              >
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
              <Link
                onClick={() => onClickLink()}
                to={{ pathname: item.pathName, search: location.search }}
              >
                {item.title}
              </Link>
            </StyledMenuItem>
          ))}
          <AccordionContainer isOpen>
            <StyledMenuItem onClick={toggleAboutAccordion}>
              About{" "}
              {isAboutAccordionOpen ? (
                <ChevronUp stroke="#9daab2" strokeWidth="1" />
              ) : (
                <ChevronDown stroke="#9daab2" strokeWidth="1" />
              )}
            </StyledMenuItem>
            {isAboutAccordionOpen &&
              sidebarAboutLinks.map((item) => (
                <StyledMenuItem key={item.link}>
                  <a href={item.link} target="_blank" rel="noreferrer">
                    {item.title}
                  </a>
                </StyledMenuItem>
              ))}
          </AccordionContainer>
        </StyledMenu>
      </StyledSidebar>
    </>
  );
};

export default Sidebar;
