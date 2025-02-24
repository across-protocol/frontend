import styled from "@emotion/styled";

import { getChainInfo, isSupportedChainId, shortenAddress } from "utils";
import { useConnection } from "hooks";
import { ReactComponent as LogoutIcon } from "assets/icons/logout.svg";

import { SidebarItem } from "./SidebarItem";
import { SecondaryButton } from "components/Button";
import { Text } from "components/Text";

export function AccountContent() {
  const { connect, disconnect, account, isConnected, chainId, connector } =
    useConnection();

  const chainInfo = isSupportedChainId(chainId)
    ? getChainInfo(chainId)
    : {
        name: "Unsupported Network",
        logoURI: "",
      };

  return (
    <SidebarItem.Header title="Account">
      {isConnected && account ? (
        <ConnectedAccount
          address={account}
          chainName={chainInfo.name}
          chainLogoUrl={chainInfo.logoURI}
          onClickDisconnect={() =>
            disconnect({ connector, trackSection: "mobileNavSidebar" })
          }
        />
      ) : (
        <ConnectButton
          onClick={() => {
            connect({ trackSection: "mobileNavSidebar" });
          }}
        >
          Connect Wallet
        </ConnectButton>
      )}
    </SidebarItem.Header>
  );
}

function ConnectedAccount(props: {
  address: string;
  chainName: string;
  chainLogoUrl: string;
  onClickDisconnect: () => void;
}) {
  return (
    <ConnectedAccountContainer>
      <ConnectedAccountLeftContainer>
        <ConnectedAccountChainLogoContainer>
          <img src={props.chainLogoUrl} alt={props.chainName} />
        </ConnectedAccountChainLogoContainer>
        <ConnectedAccountAddressContainer>
          <Text color="light-200">
            {shortenAddress(props.address, "...", 4)}
          </Text>
          <Text color="grey-400">{props.chainName}</Text>
        </ConnectedAccountAddressContainer>
      </ConnectedAccountLeftContainer>
      <DisconnectButton onClick={props.onClickDisconnect}>
        <LogoutIcon />
      </DisconnectButton>
    </ConnectedAccountContainer>
  );
}

const ConnectButton = styled(SecondaryButton)`
  margin-bottom: 12px;
`;

const DisconnectButton = styled.div`
  display: flex;
  width: 32px;
  height: 32px;
  padding: 8px;
  justify-content: center;
  align-items: center;
  gap: 8px;

  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const ConnectedAccountContainer = styled.div`
  display: flex;
  height: 64px;
  padding: 12px;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.05);
`;

const ConnectedAccountLeftContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ConnectedAccountChainLogoContainer = styled.div`
  display: flex;
  width: 32px;
  height: 32px;
  padding: 6px;
  justify-content: center;
  align-items: center;

  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.05);
  box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.15);

  img {
    width: 20px;
    height: 20px;
  }
`;

const ConnectedAccountAddressContainer = styled.div`
  display: flex;
  flex-direction: column;
`;
