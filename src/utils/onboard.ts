import { init } from "@web3-onboard/react";
import injectedModule from "@web3-onboard/injected-wallets";
import walletConnectModule from "@web3-onboard/walletconnect";
import gnosisModule from "@web3-onboard/gnosis";
import coinbaseModule from "@web3-onboard/coinbase";

import {
  onboardApiKey,
  walletConnectProjectId,
  chainInfoList,
  providerUrlsTable,
} from "utils";
import logo from "assets/token-logos/acx.svg";

const injected = injectedModule();
const gnosis = gnosisModule();
const walletConnect = walletConnectModule({
  projectId: walletConnectProjectId,
  version: 2,
});
const coinbase = coinbaseModule({
  supportedWalletType: "all",
});

export function onboardInit() {
  return init({
    apiKey: onboardApiKey,
    wallets: [injected, coinbase, walletConnect, gnosis],

    chains: chainInfoList.map((chainInfo) => ({
      id: chainInfo.chainId,
      label: chainInfo.fullName || chainInfo.name,
      token: chainInfo.nativeCurrencySymbol,
      rpcUrl: chainInfo.rpcUrl || providerUrlsTable[chainInfo.chainId],
    })),

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
  });
}
