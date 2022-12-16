import { WalletState } from "@web3-onboard/core";
import { utils } from "ethers";

import { ampli, ConnectWalletButtonClickedProperties } from "ampli";
import { pageLookup } from "components/RouteTrace/useRouteTrace";

export function getPageValue() {
  const path = window.location.pathname;
  const page = pageLookup[path] ?? "404Page";
  return page;
}

export function trackConnectWalletButtonClicked(
  section: ConnectWalletButtonClickedProperties["section"]
) {
  return ampli.connectWalletButtonClicked({
    action: "onClick",
    element: "connectWalletButton",
    page: getPageValue(),
    section,
  });
}

export function trackIfWalletSelected(
  walletStates: WalletState[],
  previousConnection?: string | null
) {
  // Only track if user explicitly selected a wallet in the web3-onboard modal
  if (walletStates.length > 0 && !previousConnection) {
    return ampli.walletSelected({
      page: getPageValue(),
      action: "onClick",
      element: "web3OnboardModal",
      walletType: walletStates[0].label,
    });
  }
}

export function trackWalletConnectTransactionCompleted(
  walletStates: WalletState[],
  previousConnection?: string | null
) {
  if (walletStates.length === 0) {
    return ampli.walletConnectTransactionCompleted({
      isReconnect: false,
      succeeded: false,
    });
  }

  return ampli.walletConnectTransactionCompleted({
    isReconnect: Boolean(previousConnection),
    succeeded: true,
    walletAddress: utils.getAddress(walletStates[0].accounts[0].address),
    walletType: walletStates[0].label,
  });
}
