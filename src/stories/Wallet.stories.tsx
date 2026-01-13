import type { Meta, StoryObj } from "@storybook/react";

import {
  ConnectedAccount,
  ConnectButton,
  BalanceButton,
  WalletWrapper,
  Separator,
} from "../components/Wallet";

import mainnetLogo from "assets/chain-logos/mainnet.svg";
import solanaLogo from "assets/chain-logos/solana.svg";

const meta: Meta<typeof ConnectedAccount> = {
  title: "Wallet/ConnectedAccount",
  component: ConnectedAccount,
  decorators: [
    (Story) => (
      <div style={{ backgroundColor: "#2d2e33", padding: "20px" }}>
        <WalletWrapper>
          <BalanceButton>
            <Story />
          </BalanceButton>
        </WalletWrapper>
      </div>
    ),
  ],
  argTypes: {
    ensName: {
      control: "text",
      description: "ENS name for the connected wallet",
    },
    hlName: {
      control: "text",
      description: "Hyperliquid name for the connected wallet",
    },
    address: {
      control: "text",
      description: "Wallet address",
    },
    chainName: {
      control: "text",
      description: "Name of the connected chain",
    },
  },
};

export default meta;

type Story = StoryObj<typeof ConnectedAccount>;

const defaultAddress = "0x7765007Ef1b9B75378F481613D842Fd7613e26f2";

export const BothNames: Story = {
  name: "Both ENS & Hyperliquid",
  args: {
    chainLogoUrl: mainnetLogo,
    chainName: "Ethereum",
    address: defaultAddress,
    ensName: "vitalik.eth",
    hlName: "vitalik.hl",
  },
};

export const EnsOnly: Story = {
  name: "ENS Name Only",
  args: {
    chainLogoUrl: mainnetLogo,
    chainName: "Ethereum",
    address: defaultAddress,
    ensName: "vitalik.eth",
    hlName: null,
  },
};

export const HlOnly: Story = {
  name: "Hyperliquid Name Only",
  args: {
    chainLogoUrl: mainnetLogo,
    chainName: "Ethereum",
    address: defaultAddress,
    ensName: null,
    hlName: "trader.hl",
  },
};

export const NoNames: Story = {
  name: "No Names (Address Only)",
  args: {
    chainLogoUrl: mainnetLogo,
    chainName: "Ethereum",
    address: defaultAddress,
    ensName: null,
    hlName: null,
  },
};

export const SolanaWallet: Story = {
  name: "Solana Wallet",
  args: {
    chainLogoUrl: solanaLogo,
    chainName: "Solana",
    address: "7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV",
    ensName: null,
    hlName: null,
  },
};

const connectButtonMeta: Meta<typeof ConnectButton> = {
  title: "Wallet/ConnectButton",
  component: ConnectButton,
  decorators: [
    (Story) => (
      <div style={{ backgroundColor: "#2d2e33", padding: "20px" }}>
        <Story />
      </div>
    ),
  ],
};

export const NotConnected: StoryObj<typeof ConnectButton> = {
  render: () => <ConnectButton>Connect</ConnectButton>,
  parameters: {
    ...connectButtonMeta,
  },
};

const defaultSolanaAddress = "7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV";

export const EvmAndSvmConnected: Story = {
  name: "EVM + SVM Connected",
  decorators: [
    () => (
      <div style={{ backgroundColor: "#2d2e33", padding: "20px" }}>
        <WalletWrapper>
          <BalanceButton>
            <ConnectedAccount
              chainLogoUrl={mainnetLogo}
              chainName="Ethereum"
              address={defaultAddress}
              ensName="vitalik.eth"
              hlName="vitalik.hl"
            />
            <Separator />
            <ConnectedAccount
              chainLogoUrl={solanaLogo}
              chainName="Solana"
              address={defaultSolanaAddress}
            />
          </BalanceButton>
        </WalletWrapper>
      </div>
    ),
  ],
};

export const EvmAndSvmConnectedNoNames: Story = {
  name: "EVM + SVM Connected (No Names)",
  decorators: [
    () => (
      <div style={{ backgroundColor: "#2d2e33", padding: "20px" }}>
        <WalletWrapper>
          <BalanceButton>
            <ConnectedAccount
              chainLogoUrl={mainnetLogo}
              chainName="Ethereum"
              address={defaultAddress}
            />
            <Separator />
            <ConnectedAccount
              chainLogoUrl={solanaLogo}
              chainName="Solana"
              address={defaultSolanaAddress}
            />
          </BalanceButton>
        </WalletWrapper>
      </div>
    ),
  ],
};
