import { useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Menu,
  SubMenu,
  MenuItem,
  Sidebar as ReactProSidebar,
  sidebarClasses,
  menuClasses,
} from "react-pro-sidebar";

import {
  StyledHeader,
  CloseButton,
  HeaderText,
  ConnectButton,
  DisconnectButton,
  ConnectText,
  TopHeaderRow,
} from "./Sidebar.styles";
import { getChainInfo, isSupportedChainId } from "utils";
import useSidebar from "./useSidebar";
import closeIcon from "assets/across-close-button.svg";
import { useConnection } from "hooks";
import { Text } from "components";

interface Props {
  openSidebar: boolean;
  setOpenSidebar: React.Dispatch<React.SetStateAction<boolean>>;
}

const sidebarWidth = "450px";

const sidebarRootStyles = {
  zIndex: "3000 !important",
  direction: "ltr !important", // hack to display on the right side
  [`@media (max-width: ${sidebarWidth})`]: {
    width: "100%",
    minWidth: "100%",
  },
  borderLeftWidth: "0px !important",
  [`.${sidebarClasses.container}`]: {
    background: "#34353a",
  },
};

const subMenuRootStyles = {
  backgroundColor: "#34353a",
  color: "#b5c3ceff",
  [`.${menuClasses.subMenuContent}`]: {
    backgroundColor: "#34353a",
  },
};

const Sidebar = ({ openSidebar, setOpenSidebar }: Props) => {
  const {
    sidebarNavigationLinks,
    sidebarAboutLinks,
    account,
    ensName,
    isConnected,
    chainId,
    toggleAboutAccordion,
    setIsAboutAccordionOpen,
    isAboutAccordionOpen,
  } = useSidebar(openSidebar);
  const { connect, disconnect, wallet } = useConnection();
  const addrOrEns = ensName ?? account;

  const onClickLink = useCallback(() => {
    setOpenSidebar(false);
    setIsAboutAccordionOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onClickOverlay = useCallback(() => {
    setOpenSidebar(false);
    setIsAboutAccordionOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ReactProSidebar
      onBackdropClick={onClickOverlay}
      toggled={openSidebar}
      breakPoint="all"
      width={sidebarWidth}
      // @ts-ignore
      rootStyles={sidebarRootStyles}
      rtl // hack to display on the right side
    >
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
          <DisconnectButton
            onClick={() =>
              disconnect(wallet, { trackSection: "mobileNavSidebar" })
            }
          >
            Disconnect
          </DisconnectButton>
        ) : null}
      </StyledHeader>
      <Menu
        closeOnClick={true}
        menuItemStyles={{
          button: {
            ":hover": {
              backgroundColor: "#34353a",
            },
          },
        }}
      >
        {sidebarNavigationLinks.map((item) => (
          <MenuItem
            key={item.title}
            onClick={onClickLink}
            component={<Link to={item.pathName} />}
          >
            <Text>{item.title}</Text>
          </MenuItem>
        ))}
        <SubMenu
          label="About"
          open={isAboutAccordionOpen}
          onOpenChange={toggleAboutAccordion}
          rootStyles={subMenuRootStyles}
        >
          {sidebarAboutLinks.map((item) => (
            <MenuItem
              key={item.title}
              component={
                <a href={item.link} target="_blank" rel="noreferrer">
                  {item.title}
                </a>
              }
            >
              <Text>{item.title}</Text>
            </MenuItem>
          ))}
        </SubMenu>
      </Menu>
    </ReactProSidebar>
  );
};

export default Sidebar;
