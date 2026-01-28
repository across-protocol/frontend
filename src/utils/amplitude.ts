import { BigNumber, utils } from "ethers";
import { Identify } from "@amplitude/analytics-browser";

import {
  ampli,
  ConnectWalletButtonClickedProperties,
  DisconnectWalletButtonClickedProperties,
  MaxTokenAmountClickedProperties,
} from "ampli";
import { ChainId, getChainInfo, getToken } from "./constants";
import { convertToCapitalCase } from "./format";
import { getConfig } from "./config";
import { categorizeNumberInRange } from "./math";
import { range } from "lodash";

export const pageLookup: Record<
  string,
  | "404Page"
  | "splashPage"
  | "bridgePage"
  | "poolPage"
  | "rewardsPage"
  | "transactionsPage"
  | "stakingPage"
  | "referralPage"
  | "airdropPage"
> = {
  "/": "splashPage",
  "/bridge": "bridgePage",
  "/bridge-and-swap": "bridgePage",
  "/pool": "poolPage",
  "/rewards": "rewardsPage",
  "/rewards/referrals": "referralPage",
  "/rewards/optimism-grant-program": "referralPage",
  "/airdrop": "airdropPage",
  "/transactions": "transactionsPage",
  ...getConfig()
    .getPoolSymbols()
    .reduce(
      (acc, sym) => ({
        ...acc,
        [`/rewards/staking/${sym.toLowerCase()}`]: "stakingPage",
      }),
      {}
    ),
};

export function getPageValue() {
  // Resolve the sanitized pathname
  const path = getSanitizedPathname();

  // Check if the path is a deposit status page. We know that the
  // deposit status page will always have a path that starts with /bridge-and-swap/0x{tx hash}
  if (/\/bridge-and-swap\/0x[0-9a-fA-F]+/.test(path)) {
    return "depositStatusPage";
  }

  // Check if the path is in the page lookup. If it is, return the value
  // from the page lookup. If it isn't, return the 404 page
  return pageLookup[path] ?? "404Page";
}

/**
 * Returns the sanitized pathname of the current URL. This function performs the following transformations:
 * 1. Removes any trailing slashes
 * 2. Makes the path lowercase
 * @returns The sanitized pathname of the current URL
 */
export function getSanitizedPathname(): string {
  return window.location.pathname.replace(/\/$/, "").toLowerCase();
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

export function trackIfWalletSelected(walletType: string) {
  // Only track if user explicitly selected a wallet in the sidebar
  if (walletType) {
    return ampli.walletSelected({
      page: getPageValue(),
      action: "onClick",
      element: "web3OnboardModal",
      walletType,
    });
  }
}

export function trackWalletConnectTransactionCompleted(
  connectedWallet: string,
  walletType: string,
  isReconnect?: boolean
) {
  return ampli.walletConnectTransactionCompleted({
    isReconnect,
    succeeded: true,
    walletAddress: connectedWallet,
    walletType,
  });
}

export function trackDisconnectWalletButtonClicked(
  section: DisconnectWalletButtonClickedProperties["section"]
) {
  return ampli.disconnectWalletButtonClicked({
    action: "onClick",
    element: "disconnectWalletButton",
    page: getPageValue(),
    section,
  });
}

export function setUserId(walletAddress?: string) {
  if (!walletAddress) {
    return;
  }

  ampli.client?.setUserId(walletAddress);
}

export function identifyUserWallet(
  connectedAddress: string,
  walletType: string
) {
  if (!connectedAddress || !walletType) {
    return;
  }

  ampli.client?.setUserId(connectedAddress);

  const identifyObj = new Identify();
  identifyObj.postInsert("AllWalletAddressesConnected", connectedAddress);
  identifyObj.set("WalletAddress", connectedAddress);
  identifyObj.set("WalletType", walletType);
  return ampli.client?.identify(identifyObj);
}

export function identifyWalletChainId(chainId: string | number) {
  const identifyObj = new Identify();
  identifyObj.postInsert("AllWalletChainIds", chainId);
  return ampli.client?.identify(identifyObj);
}

export function identifyReferrer() {
  let referrer, referring_domain;

  try {
    referrer = document.referrer || undefined;
    referring_domain = referrer?.split("/")[2] ?? undefined;
  } catch (error) {
    return;
  }

  if (!referrer || !referring_domain || referring_domain === "across.to") {
    return;
  }

  const identifyObj = new Identify();
  identifyObj.set("referrer", referrer);
  identifyObj.set("referring_domain", referring_domain);
  return ampli.client?.identify(identifyObj);
}

export function trackMaxButtonClicked(
  section: MaxTokenAmountClickedProperties["section"]
) {
  return ampli.maxTokenAmountClicked({
    action: "onClick",
    element: "maxButton",
    page: getPageValue(),
    section,
  });
}

// generate transfer confirmed quote

export function reportTokenBalance(
  chainId: ChainId,
  balance: BigNumber,
  symbol: string
) {
  const token = getToken(symbol);
  const chain = getChainInfo(chainId);

  const chainName = convertToCapitalCase(chain.name);
  const tokenName = convertToCapitalCase(token.symbol);
  const tokenBalance = Number(utils.formatUnits(balance, token.decimals));

  const identifyObj = new Identify();
  identifyObj.set(`${chainName}${tokenName}WalletCurrentBalance`, tokenBalance);
  ampli.client?.identify(identifyObj);
}

export function reportTotalWalletUsdBalance(totalBalance: number) {
  // Categorize the total balance into a range. The range will be from 0 to 1000,
  // from 10000 to 100000 in increments of 10000, from 100000 to 250000, and from 250000 to 1000000
  const totalBalanceStringRange = categorizeNumberInRange(totalBalance, [
    0,
    1_000,
    ...range(10_000, 100_000, 10_000),
    100_000,
    250_000,
    1_000_000,
  ]);

  const identifyObj = new Identify();
  identifyObj.set("AllAssetsAllNetworksWalletCurrentBalanceUsd", totalBalance);
  identifyObj.set(
    "AllAssetsAllNetworksWalletCurrentBalanceUsdRange",
    totalBalanceStringRange
  );
  ampli.client?.identify(identifyObj);
}
