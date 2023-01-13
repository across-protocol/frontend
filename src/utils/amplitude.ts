import { WalletState } from "@web3-onboard/core";
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
  TransferDepositConfirmedProperties,
} from "ampli";
import { pageLookup } from "components/RouteTrace/useRouteTrace";
import {
  TokenInfo,
  ChainInfo,
  fixedPointAdjustment,
  getToken,
  getChainInfo,
} from "./constants";
import { ConfirmationDepositTimeType, GetBridgeFeesResult } from "./bridge";
import { ConvertDecimals } from "./convertdecimals";
import {
  formatUnits,
  formatEther,
  formatWeiPct,
  capitalizeFirstLetter,
} from "./format";
import { getConfig } from "./config";
import { ChainId } from "./utils";

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

  ampli.client?.setUserId(connectedWalletAddress);

  const identifyObj = new Identify();
  identifyObj.postInsert("allWalletAddressesConnected", connectedWalletAddress);
  identifyObj.postInsert("allWalletChainIds", connectedWallet.chains[0].id);
  identifyObj.set("walletAddress", connectedWalletAddress);
  identifyObj.set("walletType", connectedWallet.label);
  return ampli.client?.identify(identifyObj);
}

export function trackWalletChainId(chainId: string) {
  const identifyObj = new Identify();
  identifyObj.postInsert("allWalletChainIds", chainId);
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
  estimatedTimeToRelayObject: ConfirmationDepositTimeType,
  amount: BigNumber
): TransferQuoteReceivedProperties {
  // Create a function that converts a wei amount into a formatted token amount
  const formatTokens = (wei: BigNumber) =>
    formatUnits(wei, tokenInfo?.decimals ?? 18).replaceAll(",", "");
  // Create a function that converts a wei amount to a USD equivalent
  const usdEquivalent = (wei: BigNumber) =>
    tokenPrice
      .mul(
        ConvertDecimals(tokenInfo?.decimals ?? 18, 18)(wei ?? BigNumber.from(0))
      )
      .div(fixedPointAdjustment);
  // Create a function that converts a wei amount to a USD equivalent string
  const usdEquivalentString = (wei: BigNumber) =>
    formatEther(usdEquivalent(wei)).replaceAll(",", "");
  const formatWeiEtherPct = (wei: BigNumber) => formatWeiPct(wei)!.toString();

  const totalBridgeFee = fees.relayerFee.total.add(fees.lpFee.total);
  const totalBridgeFeePct = fees.relayerFee.pct.add(fees.lpFee.pct);

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
  initialQuoteTime: number
): TransferSubmittedProperties {
  // Retrieves the from symbol by address from the config
  const fromAddress = getConfig().getTokenInfoBySymbol(
    Number(quote.fromChainId),
    quote.tokenSymbol
  ).address;
  // Retrieves the to symbol by address from the config
  const toAddress = getConfig().getTokenInfoBySymbol(
    Number(quote.toChainId),
    quote.tokenSymbol
  ).address;

  return {
    ...quote,
    fromTokenAddress: fromAddress,
    referralProgramAddress: referralProgramAddress,
    timeFromFirstQuoteToTransferSubmittedInMilliseconds: String(
      Date.now() - initialQuoteTime * 1000
    ),
    transferTimestamp: String(Date.now()),
    toTokenAddress: toAddress,
  };
}

// generate transfer signed quote
export function generateTransferSigned(
  quote: TransferQuoteReceivedProperties,
  referralProgramAddress: string,
  initialSubmissionTime: number,
  txHash: string
): TransferSignedProperties {
  // Retrieves the from symbol by address from the config
  const fromAddress = getConfig().getTokenInfoBySymbol(
    Number(quote.fromChainId),
    quote.tokenSymbol
  ).address;
  // Retrieves the to symbol by address from the config
  const toAddress = getConfig().getTokenInfoBySymbol(
    Number(quote.toChainId),
    quote.tokenSymbol
  ).address;

  return {
    ...quote,
    fromTokenAddress: fromAddress,
    referralProgramAddress: referralProgramAddress,
    timeFromTransferSubmittedToTransferSignedInMilliseconds: String(
      Date.now() - initialSubmissionTime
    ),
    toTokenAddress: toAddress,
    transactionHash: txHash,
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
): TransferDepositConfirmedProperties {
  // Retrieves the from symbol by address from the config
  const fromAddress = getConfig().getTokenInfoBySymbol(
    Number(quote.fromChainId),
    quote.tokenSymbol
  ).address;
  // Retrieves the to symbol by address from the config
  const toAddress = getConfig().getTokenInfoBySymbol(
    Number(quote.toChainId),
    quote.tokenSymbol
  ).address;

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
    NetworkFeeNative: quote.relayGasFeeTotal,
    NetworkFeeUsd: quote.relayGasFeeTotalUsd.toString(),
    NetworkFeeNativeToken: quote.tokenSymbol,
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
  const tokenPriceInUSDHumanReadable = formatEther(tokenPriceInUSD).replaceAll(
    ",",
    ""
  );
  // Convert the human readable string into a number for Amplitude
  const tokenPriceInUSDNumber = Number(tokenPriceInUSDHumanReadable);

  // Generate a human readable (non gwei format) version of the token amount
  // Ensure that the human readable version does not contain commas
  const tokenAmountHumanReadable = formatUnits(amount, decimals).replaceAll(
    ",",
    ""
  );
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

  const chainName = capitalizeFirstLetter(chain.name);
  const tokenName = capitalizeFirstLetter(token.symbol);
  const tokenBalance = Number(
    formatUnits(balance, token.decimals).replaceAll(",", "")
  );

  const identifyObj = new Identify();
  identifyObj.set(`${chainName}${tokenName}WalletCurrentBalance`, tokenBalance);
  ampli.client?.identify(identifyObj);
}
