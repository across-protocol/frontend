import { BigNumber, utils } from "ethers";
import { Identify } from "@amplitude/analytics-browser";

import {
  ampli,
  ConnectWalletButtonClickedProperties,
  DisconnectWalletButtonClickedProperties,
  MaxTokenAmountClickedProperties,
  TransferQuoteReceivedProperties,
  TransferSignedProperties,
  TransferSubmittedProperties,
  TransferDepositCompletedProperties,
  QuickSwapButtonClickedProperties,
} from "ampli";
import {
  TokenInfo,
  ChainInfo,
  fixedPointAdjustment,
  getToken,
  getChainInfo,
  tokenList,
} from "./constants";
import { ConfirmationDepositTimeType, GetBridgeFeesResult } from "./bridge";
import { ConvertDecimals } from "./convertdecimals";
import {
  formatWeiPct,
  capitalizeFirstLetter,
  convertToCapitalCase,
} from "./format";
import { getConfig } from "./config";
import { ChainId } from "./constants";
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

export type ExternalProjectId = "hyper-liquid";

export function getPageValue() {
  // Resolve the sanitized pathname
  const path = getSanitizedPathname();

  // Check if the path is a deposit status page. We know that the
  // deposit status page will always have a path that starts with /bridge/0x{tx hash}
  if (/\/bridge\/0x[0-9a-fA-F]+/.test(path)) {
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
  walletType: string
) {
  return ampli.walletConnectTransactionCompleted({
    isReconnect: false,
    succeeded: true,
    walletAddress: connectedWallet,
    walletType,
  });
}

export function trackFromChainChanged(chainId: ChainId, isDefault?: boolean) {
  if (Number.isNaN(chainId)) return Promise.resolve();
  const chain = getChainInfo(chainId);
  return ampli.fromChainSelected({
    fromChainId: chain.chainId.toString(),
    chainName: chain.name,
    default: isDefault,
  });
}

export function trackToChainChanged(
  chainId: ChainId,
  externalProjectId?: ExternalProjectId,
  isDefault?: boolean
) {
  if (Number.isNaN(chainId)) return Promise.resolve();
  const chain = getChainInfo(chainId);
  return ampli.toChainSelected({
    toChainId: chain.chainId.toString(),
    chainName: chain.name,
    externalProjectId,
    default: isDefault,
  });
}

export function externalProjectNameToId(
  projectName?: string
): ExternalProjectId | undefined {
  return projectName === "hyperliquid" ? "hyper-liquid" : undefined;
}

export function trackQuickSwap(
  section: QuickSwapButtonClickedProperties["section"]
) {
  return ampli.quickSwapButtonClicked({
    element: "quickSwapButton",
    page: getPageValue(),
    section,
    action: "onClick",
  });
}

export function trackTokenChanged(tokenSymbol: string, isDefault?: boolean) {
  if (!tokenSymbol) return Promise.resolve();
  const token = getToken(tokenSymbol);
  return ampli.tokenSelected({
    tokenSymbol: token.symbol,
    default: isDefault,
    tokenListIndex: tokenList
      .findIndex((t) => t.symbol === token.symbol)
      .toString(),
    tokenListLength: tokenList.length.toString(),
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
  tokenPrice: BigNumber,
  estimatedTimeToRelayObject: ConfirmationDepositTimeType,
  amount: BigNumber,
  account?: string,
  toAddress?: string
): TransferQuoteReceivedProperties {
  // Create a function that converts a wei amount into a formatted token amount
  const formatTokens = (wei: BigNumber) =>
    utils.formatUnits(wei, tokenInfo?.decimals ?? 18);
  // Create a function that converts a wei amount to a USD equivalent
  const usdEquivalent = (wei: BigNumber) =>
    tokenPrice
      .mul(
        ConvertDecimals(tokenInfo?.decimals ?? 18, 18)(wei ?? BigNumber.from(0))
      )
      .div(fixedPointAdjustment);
  // Create a function that converts a wei amount to a USD equivalent string
  const usdEquivalentString = (wei: BigNumber) =>
    utils.formatEther(usdEquivalent(wei)).replaceAll(",", "");
  const formatWeiEtherPct = (wei: BigNumber) => formatWeiPct(wei)!.toString();

  const totalBridgeFee = fees.totalRelayFee.total;
  const totalBridgeFeePct = fees.totalRelayFee.pct;

  return {
    capitalFeePct: formatWeiEtherPct(fees.relayerCapitalFee.pct),
    capitalFeeTotal: formatTokens(fees.relayerCapitalFee.total),
    capitalFeeTotalUsd: usdEquivalentString(fees.relayerCapitalFee.total),
    expectedFillTimeInMinutes: estimatedTimeToRelayObject.formattedString,
    expectedFillTimeInMinutesLowerBound: estimatedTimeToRelayObject.lowEstimate,
    expectedFillTimeInMinutesUpperBound:
      estimatedTimeToRelayObject.highEstimate,
    fromAmount: formatTokens(amount),
    fromAmountUsd: usdEquivalentString(amount),
    fromChainId: selectedRoute.fromChain.toString(),
    fromChainName: fromChainInfo.name,
    isAmountTooLow: fees.isAmountTooLow,
    isSenderEqRecipient: account && toAddress ? toAddress === account : false,
    lpFeePct: formatWeiEtherPct(fees.lpFee.pct),
    lpFeeTotal: formatTokens(fees.lpFee.total),
    lpFeeTotalUsd: usdEquivalentString(fees.lpFee.total),
    quoteLatencyMilliseconds: fees.quoteLatency.toString(),
    quoteTimestamp: String(fees.quoteTimestamp),
    recipient: toAddress || "not connected",
    relayFeePct: formatWeiEtherPct(
      fees.relayerGasFee.pct.add(fees.relayerCapitalFee.pct)
    ),
    relayFeeTotal: formatTokens(
      fees.relayerGasFee.total.add(fees.relayerCapitalFee.total)
    ),
    relayFeeTotalUsd: usdEquivalentString(
      fees.relayerGasFee.total.add(fees.relayerCapitalFee.total)
    ),
    relayGasFeePct: formatWeiEtherPct(fees.relayerGasFee.pct),
    relayGasFeeTotal: formatTokens(fees.relayerGasFee.total),
    relayGasFeeTotalUsd: usdEquivalentString(fees.relayerGasFee.total),
    sender: account || "not connected",
    routeChainIdFromTo: `${fromChainInfo.chainId}-${toChainInfo.chainId}`,
    routeChainNameFromTo: `${fromChainInfo.name}-${toChainInfo.name}`,
    toAmount: formatTokens(amount.sub(totalBridgeFee)),
    toAmountUsd: usdEquivalentString(amount.sub(totalBridgeFee)),
    toChainId: selectedRoute.toChain.toString(),
    toChainName: toChainInfo.name,
    tokenSymbol: tokenInfo.symbol,
    totalBridgeFee: formatTokens(totalBridgeFee),
    totalBridgeFeeUsd: usdEquivalentString(totalBridgeFee),
    totalBridgeFeePct: formatWeiEtherPct(totalBridgeFeePct),
    transferQuoteBlockNumber: fees.quoteBlock.toString(),
  };
}

// generate transfer submitted quote
export function generateTransferSubmitted(
  quote: TransferQuoteReceivedProperties,
  referralProgramAddress: string,
  initialQuoteTime: number,
  externalProjectId?: string
): TransferSubmittedProperties {
  const { fromAddress, toAddress } = getConfig().getFromToAddressesBySymbol(
    quote.tokenSymbol,
    Number(quote.fromChainId),
    Number(quote.toChainId)
  );
  return {
    ...quote,
    fromTokenAddress: fromAddress,
    referralProgramAddress: referralProgramAddress,
    timeFromFirstQuoteToTransferSubmittedInMilliseconds: String(
      Date.now() - initialQuoteTime
    ),
    transferTimestamp: String(Date.now()),
    toTokenAddress: toAddress,
    externalProjectId: externalProjectNameToId(externalProjectId),
  };
}

// generate transfer signed quote
export function generateTransferSigned(
  quote: TransferQuoteReceivedProperties,
  referralProgramAddress: string,
  initialSubmissionTime: number,
  txHash: string,
  externalProjectId?: string
): TransferSignedProperties {
  const { fromAddress, toAddress } = getConfig().getFromToAddressesBySymbol(
    quote.tokenSymbol,
    Number(quote.fromChainId),
    Number(quote.toChainId)
  );
  return {
    ...quote,
    fromTokenAddress: fromAddress,
    referralProgramAddress: referralProgramAddress,
    timeFromTransferSubmittedToTransferSignedInMilliseconds: String(
      Date.now() - initialSubmissionTime
    ),
    toTokenAddress: toAddress,
    transactionHash: txHash,
    externalProjectId: externalProjectNameToId(externalProjectId),
  };
}

// generate transfer confirmed quote
export function generateDepositConfirmed(
  quote: TransferQuoteReceivedProperties,
  referralProgramAddress: string,
  initialSignTime: number,
  txHash: string,
  success: boolean,
  txCompletedTimestamp: number
): TransferDepositCompletedProperties {
  const { fromAddress, toAddress } = getConfig().getFromToAddressesBySymbol(
    quote.tokenSymbol,
    Number(quote.fromChainId),
    Number(quote.toChainId)
  );
  return {
    ...quote,
    fromTokenAddress: fromAddress,
    referralProgramAddress: referralProgramAddress,
    toTokenAddress: toAddress,
    transactionHash: txHash,
    succeeded: success,
    timeFromTransferSignedToTransferCompleteInMilliseconds: String(
      Date.now() - initialSignTime
    ),
    depositCompleteTimestamp: String(txCompletedTimestamp),
    networkFeeNative: quote.relayGasFeeTotal,
    networkFeeUsd: quote.relayGasFeeTotalUsd.toString(),
    networkFeeNativeToken: quote.tokenSymbol,
  };
}

export function recordTransferUserProperties(
  amount: BigNumber,
  tokenPrice: BigNumber,
  decimals: number,
  assetName: string,
  fromChainId: number,
  toChainId: number,
  networkName: string
) {
  // Convert assetName to capital case
  const assetNameCapitalCase = capitalizeFirstLetter(assetName);
  // Convert networkName to capital case
  const networkNameCapitalCase = capitalizeFirstLetter(networkName);

  const tokenPriceInUSD = tokenPrice
    .mul(ConvertDecimals(decimals, 18)(amount))
    .div(fixedPointAdjustment);
  // Generate a human readable (non gwei format) version of the token price in USD
  // Ensure that the human readable version does not contain commas
  const tokenPriceInUSDHumanReadable = utils.formatEther(tokenPriceInUSD);
  // Convert the human readable string into a number for Amplitude
  const tokenPriceInUSDNumber = Number(tokenPriceInUSDHumanReadable);

  // Generate a human readable (non gwei format) version of the token amount
  // Ensure that the human readable version does not contain commas
  const tokenAmountHumanReadable = utils.formatUnits(amount, decimals);
  // Convert the human readable string into a number for Amplitude
  const tokenAmountNumber = Number(tokenAmountHumanReadable);

  // Determine which is the from and to chain is an L1 or L2 chain
  const isL1L2 = fromChainId === 1 && toChainId !== 1;
  const isL2L1 = fromChainId !== 1 && toChainId === 1;
  const isL2L2 = fromChainId !== 1 && toChainId !== 1;

  const identifyObj = new Identify();

  // Add 1 to the L1L2 transfers if the transfer is from L1 to L2
  if (isL1L2) identifyObj.add("L1L2Transfers", 1);
  // Add 1 to the L2L1 transfers if the transfer is from L2 to L1
  if (isL2L1) identifyObj.add("L2L1Transfers", 1);
  // Add 1 to the L2L2 transfers if the transfer is from L2 to L2
  if (isL2L2) identifyObj.add("L2L2Transfers", 1);
  // Add 1 to the total transfers
  identifyObj.add("TotalTransfers", 1);

  // Add the usd amount of the transfer to the total usd transferred
  identifyObj.add("TotalVolumeUsd", tokenPriceInUSDNumber);

  // Add the native amount to the total transfered in the native token
  identifyObj.add(`${assetNameCapitalCase}VolumeNative`, tokenAmountNumber);
  // Add the usd amount of the transfer to the total usd transferred
  identifyObj.add(`${assetNameCapitalCase}VolumeUsd`, tokenPriceInUSDNumber);
  // Set the current balance of the native token
  identifyObj.add(
    `${networkNameCapitalCase}${assetNameCapitalCase}WalletCurrentBalance`,
    -tokenAmountNumber
  );

  return ampli.client?.identify(identifyObj);
}

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
