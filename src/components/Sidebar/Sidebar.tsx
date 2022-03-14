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
import { onboard } from "utils";
import { useConnection } from "state/hooks";

const { init, reset } = onboard;

interface Props {
  setOpenSidebar: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar: FC<Props> = ({ setOpenSidebar }) => {
  const { account, isConnected } = useConnection();

  return (
    <Overlay>
      <StyledSidebar>
        <StyledHeader>
          <CloseButton onClick={() => setOpenSidebar(false)}>X</CloseButton>
          {account && <HeaderText>{account}</HeaderText>}
          <HeaderText>Ethereum Mainnet</HeaderText>
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
