import { init } from "@web3-onboard/react";
import injectedModule from "@web3-onboard/injected-wallets";
import walletConnectModule from "@web3-onboard/walletconnect";
import gnosisModule from "@web3-onboard/gnosis";
import coinbaseModule from "@web3-onboard/coinbase";
import { onboardApiKey, ChainId, providerUrlsTable } from "utils";
import logo from "assets/across-logo-v2.svg";

const injected = injectedModule();
const gnosis = gnosisModule();
const walletConnect = walletConnectModule();
const coinbase = coinbaseModule();

/* 
export interface InitOptions {
    /**
     * Wallet modules to be initialized and added to wallet selection modal
     */
//  wallets: WalletInit[];
/**
 * The chains that your app works with
 */
//  chains: Chain[] | ChainWithDecimalId[];
/**
 * Additional metadata about your app to be displayed in the Onboard UI
 */
//  appMetadata?: AppMetadata;
/**
 * Define custom copy for the 'en' locale or add locales to i18n your app
 */
//  i18n?: i18nOptions;
/**
 * Customize the connect modal
 */
//  connect?: ConnectModalOptions;
/**
 * Customize the account center UI
 */
//  accountCenter?: AccountCenterOptions;
/**
 * Opt in to Blocknative value add services (transaction updates) by providing
 * your Blocknative API key, head to https://explorer.blocknative.com/account
 */
//  apiKey?: string;
/**
 * Transaction notification options
 */
//  notify?: Partial<NotifyOptions> | Partial<Notify>;
/**Gas module */
//  gas?: typeof gas;
//  }

/* 
    export interface Chain {
      namespace?: 'evm';
      id: ChainId;
      rpcUrl: string;
      label: string;
      token: TokenSymbol;
      color?: string;
      icon?: string;
      providerConnectionInfo?: ConnectionInfo;
      publicRpcUrl?: string;
      blockExplorerUrl?: string;
  }
    */

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
        id: 288,
        token: "BOBA",
        label: "BOBA Mainnet",
        rpcUrl: providerUrlsTable[ChainId.BOBA],
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
        "Across is the fastest, cheapest and most secure cross-chain bridge for Ethereum, Arbitrum, Optimism, Polygon, Boba and other Layer 1 and Layer 2 networks. Transfer tokens with Across.",
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
