// import React from "react";
import Onboard from "bnc-onboard";
import { Wallet, Initialization, Ens } from "bnc-onboard/dist/src/interfaces";
import { ethers } from "ethers";
import {
  onboardApiKey,
  hubPoolChainId,
  ChainId,
  providerUrlsTable,
  trackEvent,
  debug,
} from "utils";
import { update, disconnect, error } from "state/connection";
import { store } from "state";

/* Onboard config */
export function onboardBaseConfig(): Initialization {
  return {
    dappId: onboardApiKey,
    networkId: hubPoolChainId,
    // hideBranding: true,
    walletSelect: {
      wallets: [
        { walletName: "metamask", preferred: true, label: "Metamask" },
        {
          walletName: "walletConnect",
          rpc: {
            [ChainId.MAINNET]: providerUrlsTable[ChainId.MAINNET],
            [ChainId.OPTIMISM]: providerUrlsTable[ChainId.OPTIMISM],
            [ChainId.BOBA]: providerUrlsTable[ChainId.BOBA],
            [ChainId.ARBITRUM]: providerUrlsTable[ChainId.ARBITRUM],
            [hubPoolChainId]: providerUrlsTable[hubPoolChainId],
          },
          preferred: true,
        },
        { walletName: "coinbase", preferred: true, label: "Coinbase" },
        { walletName: "walletLink", preferred: true, label: "Coinbase" },
        { walletName: "tally", preferred: true },
        { walletName: "detectedwallet" },
      ],
    },
    walletCheck: [{ checkName: "connect" }, { checkName: "accounts" }],
    // To prevent providers from requesting block numbers every 4 seconds (see https://github.com/WalletConnect/walletconnect-monorepo/issues/357)
    blockPollingInterval: 1000 * 60 * 60,
  };
}
export type Emit = (event: string, data?: any) => void;
export function OnboardEthers(config: Initialization, emit: Emit) {
  let savedWallet: Wallet | undefined;
  const onboard = Onboard({
    ...config,
    subscriptions: {
      address: (address: string) => {
        emit("update", { account: address });
        if (!address) {
          // if we dont call reset here when account is undefined, we wont be able to reconnect
          // this can happen if user locks their wallet.
          reset();
        }
      },
      network: (chainIdInHex) => {
        if (chainIdInHex == null) {
          return;
        }
        const chainId = ethers.BigNumber.from(chainIdInHex).toNumber();
        // need to make new provider on chain change
        if (savedWallet?.provider) {
          // when chain change will always follow first wallet connect or chain change, so we can emit
          // signer and provider here, so it only happens once.
          const provider = new ethers.providers.Web3Provider(
            savedWallet.provider
          );
          const signer = provider.getSigner();
          emit("update", {
            chainId,
            provider,
            signer,
          });
        } else {
          emit("update", {
            chainId,
          });
        }
      },
      wallet: (wallet: Wallet) => {
        savedWallet = wallet;
        if (wallet.provider) {
          emit("update", {
            account: wallet.provider.selectedAddress,
          });
        }
      },
      ens: (ens: Ens) => {
        const ensName = ens?.name;
        if (savedWallet?.provider) {
          emit("update", {
            ensName,
          });
        }
      },
    },
  });
  async function init() {
    try {
      await onboard.walletSelect();
      await onboard.walletCheck();
      emit("init");
    } catch (err: any) {
      emit(
        "error",
        new Error(("Could not initialize Onboard: " + err.message) as string)
      );
    }
  }
  async function reset() {
    try {
      await onboard.walletReset();
      emit("disconnect");
    } catch (err) {
      emit("error", err);
    }
  }
  return {
    init,
    reset,
    onboard,
  };
}
export const onboard = OnboardEthers(onboardBaseConfig(), (event, data) => {
  if (debug) console.log("onboard event", event, data);
  if (event === "init") {
    trackEvent({ category: "wallet", action: "connect", name: "null" });
  }
  if (event === "update") {
    store.dispatch(update(data));
  }
  if (event === "disconnect") {
    store.dispatch(disconnect());
    trackEvent({ category: "wallet", action: "disconnect", name: "null" });
  }
  if (event === "error") {
    store.dispatch(error(data));
  }
});
