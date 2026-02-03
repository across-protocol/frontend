declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

type GTMEvent = {
  event: string;
  [key: string]: unknown;
};

function pushToDataLayer(eventData: GTMEvent) {
  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push(eventData);
  }
}

export function trackGTMConnectWallet(walletType?: string) {
  pushToDataLayer({
    event: "connect_wallet",
    wallet_type: walletType,
  });
}

export function trackGTMClickConfirmSwap() {
  pushToDataLayer({
    event: "click_confirm_swap",
  });
}
