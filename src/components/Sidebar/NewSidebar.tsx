import { useSpring, animated } from "react-spring";
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
import useSidebar from "./useSidebar";
import { onboard, getChainInfo } from "utils";
import closeIcon from "assets/across-close-button.svg";

const { init, reset } = onboard;

interface Props {
  show: boolean;
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
}
const Drawer: React.FC<Props> = ({ show, setShow }) => {
  const { account, isConnected, chainId, location } = useSidebar();

  const rightMenuAnimation = useSpring({
    opacity: show ? 1 : 0,
    transform: show ? `translateX(0)` : `translateX(100%)`,
    width: "300px",
  });

  return (
    <animated.div style={rightMenuAnimation}>
      {/* <div className="drawer">Animated Drawer!</div> */}
      <div>
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
            <CloseButton onClick={() => setShow(false)}>
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
            <Link onClick={() => setShow(false)} to="/">
              Bridge
            </Link>
          </StyledMenuItem>
          <StyledMenuItem selected={location.pathname === "/pool"}>
            <Link onClick={() => setShow(false)} to="/pool">
              Pool
            </Link>
          </StyledMenuItem>
          <StyledMenuItem selected={location.pathname === "/transactions"}>
            <Link onClick={() => setShow(false)} to="/transactions">
              Transactions
            </Link>
          </StyledMenuItem>
          <StyledMenuItem selected={location.pathname === "/about"}>
            <Link onClick={() => setShow(false)} to="/about">
              About
            </Link>
          </StyledMenuItem>
          <StyledMenuItem>
            <a
              href="https://docs.across.to/bridge/"
              target="_blank"
              rel="noreferrer"
              onClick={() => setShow(false)}
            >
              Docs
            </a>
          </StyledMenuItem>
          <StyledMenuItem>
            <a
              href="https://discord.com/invite/across"
              target="_blank"
              rel="noreferrer"
              onClick={() => setShow(false)}
            >
              Support (Discord)
            </a>
          </StyledMenuItem>
          <StyledMenuItem>
            <a
              href="https://github.com/across-protocol"
              target="_blank"
              rel="noreferrer"
              onClick={() => setShow(false)}
            >
              Github
            </a>
          </StyledMenuItem>
          <StyledMenuItem>
            <a
              href="https://twitter.com/AcrossProtocol/"
              target="_blank"
              rel="noreferrer"
              onClick={() => setShow(false)}
            >
              Twitter
            </a>
          </StyledMenuItem>
          <StyledMenuItem>
            <a
              href="https://medium.com/across-protocol"
              target="_blank"
              rel="noreferrer"
              onClick={() => setShow(false)}
            >
              Medium
            </a>
          </StyledMenuItem>
          <StyledMenuItem>
            <a
              href="https://forum.across.to/"
              target="_blank"
              rel="noreferrer"
              onClick={() => setShow(false)}
            >
              Discourse
            </a>
          </StyledMenuItem>
        </StyledMenu>
      </div>
    </animated.div>
  );
};

export default Drawer;
