import { WalletState } from "@web3-onboard/core";
import { BigNumber, utils } from "ethers";
import { Identify } from "@amplitude/analytics-browser";

import {
  ampli,
  ConnectWalletButtonClickedProperties,
  DisconnectWalletButtonClickedProperties,
  MaxTokenAmountClickedProperties,
  TransferQuoteRecievedProperties,
} from "ampli";
import { pageLookup } from "components/RouteTrace/useRouteTrace";
import { TokenInfo, ChainInfo, fixedPointAdjustment } from "./constants";
import { GetBridgeFeesResult } from "./bridge";
import { ConvertDecimals } from "./convertdecimals";
import { formatUnits, formatEther, formatWeiPct } from "./format";

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

export function identifyUserWallets(walletStates: WalletState[]) {
  if (walletStates.length === 0) {
    return;
  }

  const [connectedWallet] = walletStates;
  const connectedWalletAddress = utils.getAddress(
    connectedWallet.accounts[0].address
  );

  const identifyObj = new Identify();
  identifyObj.postInsert("allWalletAddressesConnected", connectedWalletAddress);
  identifyObj.postInsert("allWalletChainIds", connectedWallet.chains[0].id);
  identifyObj.set("walletAddress", connectedWalletAddress);
  identifyObj.set("walletType", connectedWallet.label);
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

export function generateTransferQuote(
  fees: GetBridgeFeesResult,
  selectedRoute: {
    fromChain: number;
    toChain: number;
    fromTokenAddress: string;
    fromSpokeAddress: string;
    fromTokenSymbol: string;
    isNative: boolean;
    l1TokenAddress: string;
  },
  tokenInfo: TokenInfo,
  fromChainInfo: ChainInfo,
  toChainInfo: ChainInfo,
  toAddress: string,
  account: string,
  tokenPrice: BigNumber,
  timeToRelay: string,
  amount: BigNumber
): TransferQuoteRecievedProperties {
  // Create a function that converts a wei amount into a formatted token amount
  const formatTokens = (wei: BigNumber) =>
    formatUnits(wei, tokenInfo?.decimals ?? 18);
  // Create a function that converts a wei amount to a USD equivalent
  const usdEquivalent = (wei: BigNumber) =>
    tokenPrice
      .mul(
        ConvertDecimals(tokenInfo?.decimals ?? 18, 18)(wei ?? BigNumber.from(0))
      )
      .div(fixedPointAdjustment);
  // Create a function that converts a wei amount to a USD equivalent string
  const usdEquivalentString = (wei: BigNumber) =>
    formatEther(usdEquivalent(wei));
  const formatWeiEtherPct = (wei: BigNumber) => formatWeiPct(wei)!.toString();

  return {
    capitalFeePct: formatWeiEtherPct(fees.relayerCapitalFee.pct),
    capitalFeeTotal: formatTokens(fees.relayerCapitalFee.total),
    capitalFeeTotalUsd: usdEquivalentString(fees.relayerCapitalFee.total),
    expectedFillTimeInMinutes: timeToRelay,
    fromAmount: formatTokens(amount),
    fromAmountUsd: usdEquivalentString(amount),
    fromChainId: selectedRoute.fromChain.toString(),
    fromChainName: fromChainInfo.name,
    isAmountTooLow: fees.isAmountTooLow,
    isSenderEqRecipient: toAddress === account,
    lpFeePct: formatWeiEtherPct(fees.lpFee.pct),
    lpFeeTotal: formatTokens(fees.lpFee.total),
    lpFeeTotalUsd: usdEquivalentString(fees.lpFee.total),
    quoteLatencyMilliseconds: (
      Date.now() - Number(fees.quoteTimestamp?.toString() ?? Date.now())
    ).toString(),
    quoteTimestamp: String(fees.quoteTimestamp ?? Date.now()),
    recipient: toAddress,
    relayFeePct: formatWeiEtherPct(fees.relayerFee.pct),
    relayFeeTotal: formatTokens(fees.relayerFee.total),
    relayFeeTotalUsd: usdEquivalentString(fees.relayerFee.total),
    relayGasFeePct: formatWeiEtherPct(fees.relayerGasFee.pct),
    relayGasFeeTotal: formatTokens(fees.relayerGasFee.total),
    relayGasFeeTotalUsd: usdEquivalentString(fees.relayerGasFee.total),
    sender: account,
    routeChainIdFromTo: toChainInfo.chainId.toString(),
    routeChainNameFromTo: toChainInfo.name,
    toAmount: formatTokens(amount),
    toAmountUsd: usdEquivalentString(amount),
    toChainId: selectedRoute.toChain.toString(),
    toChainName: toChainInfo.name,
    tokenSymbol: tokenInfo.symbol,
    totalBridgeFee: formatTokens(
      fees.relayerCapitalFee.total
        .add(fees.lpFee.total)
        .add(fees.relayerFee.total)
        .add(fees.relayerGasFee.total)
    ),
    totalBridgeFeeUsd: usdEquivalentString(
      fees.relayerCapitalFee.total
        .add(fees.lpFee.total)
        .add(fees.relayerFee.total)
        .add(fees.relayerGasFee.total)
    ),
    totalBridgeFeePct: formatWeiEtherPct(
      fees.relayerCapitalFee.pct
        .add(fees.lpFee.pct)
        .add(fees.relayerFee.pct)
        .add(fees.relayerGasFee.pct)
    ),
    transferQuoteBlockNumber: fees.quoteBlock.toString(),
  };
}
