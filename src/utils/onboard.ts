// import React from "react";
import Onboard from "bnc-onboard";
import { Wallet, Initialization } from "bnc-onboard/dist/src/interfaces";
import { ethers } from "ethers";
import { onboardBaseConfig } from "utils";
import { update, disconnect, error } from "state/connection";
import { store } from "state";

export type Emit = (event: string, data?: any) => void;
export function OnboardEthers(config: Initialization, emit: Emit) {
  let savedWallet: Wallet | undefined;
  const onboard = Onboard({
    ...config,
    subscriptions: {
      address: (address: string) => {
        emit("update", { account: address });
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
  if (event === "update") {
    store.dispatch(update(data));
  }
  if (event === "disconnect") {
    store.dispatch(disconnect());
  }
  if (event === "error") {
    store.dispatch(error(data));
  }
});
