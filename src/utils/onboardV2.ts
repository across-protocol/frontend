import Onboard, { OnboardAPI } from "@web3-onboard/core";
import injectedModule from "@web3-onboard/injected-wallets";
import walletConnectModule from "@web3-onboard/walletconnect";
import gnosisModule from "@web3-onboard/gnosis";
import coinbaseModule from "@web3-onboard/coinbase";
import { ethers } from "ethers";
import {
  onboardApiKey,
  ChainId,
  providerUrlsTable,
  trackEvent,
  debug,
} from "utils";
import { update, disconnect, error } from "state/connection";
import { store } from "state";

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

export function onboardBaseConfig() {
  return Onboard({
    apiKey: onboardApiKey,
    wallets: [injected, coinbase, walletConnect, gnosis],
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
  });
}

// export type Emit = (event: string, data?: any) => void;
// export function OnboardEthers(config: OnboardAPI, emit: Emit) {
//   let savedWallet: Wallet | undefined;
//   const onboard = Onboard({
//     ...config,
//     subscriptions: {
//       address: (address: string) => {
//         emit("update", { account: address });
//         if (!address) {
//           // if we dont call reset here when account is undefined, we wont be able to reconnect
//           // this can happen if user locks their wallet.
//           reset();
//         }
//       },
//       network: (chainIdInHex) => {
//         if (chainIdInHex == null) {
//           return;
//         }
//         const chainId = ethers.BigNumber.from(chainIdInHex).toNumber();
//         // need to make new provider on chain change
//         if (savedWallet?.provider) {
//           // when chain change will always follow first wallet connect or chain change, so we can emit
//           // signer and provider here, so it only happens once.
//           const provider = new ethers.providers.Web3Provider(
//             savedWallet.provider
//           );
//           const signer = provider.getSigner();
//           emit("update", {
//             chainId,
//             provider,
//             signer,
//           });
//         } else {
//           emit("update", {
//             chainId,
//           });
//         }
//       },
//       wallet: (wallet: Wallet) => {
//         savedWallet = wallet;
//         if (wallet.provider) {
//           emit("update", {
//             account: wallet.provider.selectedAddress,
//           });
//         }
//       },
//       ens: (ens: Ens) => {
//         const ensName = ens?.name;
//         if (savedWallet?.provider) {
//           emit("update", {
//             ensName,
//           });
//         }
//       },
//     },
//   });
//   async function init() {
//     try {
//       await onboard.walletSelect();
//       await onboard.walletCheck();
//       emit("init");
//     } catch (err: any) {
//       emit(
//         "error",
//         new Error(("Could not initialize Onboard: " + err.message) as string)
//       );
//     }
//   }
//   async function reset() {
//     try {
//       await onboard.walletReset();
//       emit("disconnect");
//     } catch (err) {
//       emit("error", err);
//     }
//   }
//   return {
//     init,
//     reset,
//     onboard,
//   };
// }

// export const onboard = OnboardEthers(onboardBaseConfig(), (event, data) => {
//   if (debug) console.log("onboard event", event, data);
//   if (event === "init") {
//     trackEvent({ category: "wallet", action: "connect", name: "null" });
//   }
//   if (event === "update") {
//     store.dispatch(update(data));
//   }
//   if (event === "disconnect") {
//     store.dispatch(disconnect());
//     trackEvent({ category: "wallet", action: "disconnect", name: "null" });
//   }
//   if (event === "error") {
//     store.dispatch(error(data));
//   }
// });
