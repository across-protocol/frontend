import { init } from "@web3-onboard/react";
import injectedModule from "@web3-onboard/injected-wallets";
import walletConnectModule from "@web3-onboard/walletconnect";
import gnosisModule from "@web3-onboard/gnosis";
import coinbaseModule from "@web3-onboard/coinbase";
import { onboardApiKey, ChainId } from "utils";
import { providerUrlsTable } from "utils/providers";
import logo from "assets/across-logo-v2.svg";

const injected = injectedModule();
const gnosis = gnosisModule();
const walletConnect = walletConnectModule();
const coinbase = coinbaseModule();

export function onboardInit() {
  return init({
    apiKey: onboardApiKey,
    wallets: [injected, coinbase, walletConnect, gnosis],

    chains: [
      {
        id: 1,
        token: "ETH",
        label: "Ethereum Mainnet",
        rpcUrl: providerUrlsTable[ChainId.MAINNET],
      },
      {
        id: 5,
        token: "ETH",
        label: "Goerli Testnet",
        rpcUrl: providerUrlsTable[ChainId.GOERLI],
      },
      {
        id: 10,
        token: "OP",
        label: "Optimism Mainnet",
        rpcUrl: providerUrlsTable[ChainId.OPTIMISM],
      },
      {
        id: 137,
        token: "MATIC",
        label: "Polygon Mainnet",
        rpcUrl: providerUrlsTable[ChainId.POLYGON],
      },
      {
        id: 42161,
        token: "ETH",
        label: "Arbitrum Mainnet",
        rpcUrl: providerUrlsTable[ChainId.ARBITRUM],
      },
    ],
    appMetadata: {
      name: "Across Bridge",
      icon: logo,
      description:
        "Across is the fastest, cheapest and most secure cross-chain bridge for Ethereum, Arbitrum, Optimism, Polygon and other Layer 1 and Layer 2 networks. Transfer tokens with Across.",
      recommendedInjectedWallets: [
        { name: "Metamask", url: "https://metamask.io" },
        { name: "Coinbase", url: "https://wallet.coinbase.com/" },
        { name: "WalletConnect", url: "https://walletconnect.org/" },
        { name: "Gnosis Safe", url: "https://gnosis.safe/" },
      ],
    },
    accountCenter: {
      desktop: {
        enabled: false,
      },
      mobile: {
        enabled: false,
      },
    },
    notify: {
      enabled: false,
    },
  });
}
