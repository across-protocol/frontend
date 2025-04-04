import { BigNumber, providers, utils } from "ethers";

import { Deposit } from "hooks/useDeposits";
import { getConfig, getFillByDepositTxHash } from "utils";
import { FromBridgePagePayload } from "views/Bridge/hooks/useBridgeAction";

const config = getConfig();

export function convertForDepositQuery(
  data: {
    depositTxReceipt: providers.TransactionReceipt;
    parsedDepositLog: utils.LogDescription;
    depositTimestamp: number;
  },
  fromBridgePagePayload: FromBridgePagePayload
): Deposit {
  const { selectedRoute, depositArgs, quoteForAnalytics } =
    fromBridgePagePayload;
  const { depositId, depositor, recipient, message, inputAmount } =
    data.parsedDepositLog.args;
  const inputToken = config.getTokenInfoBySymbol(
    selectedRoute.fromChain,
    selectedRoute.fromTokenSymbol
  );
  const outputToken = config.getTokenInfoBySymbol(
    selectedRoute.toChain,
    selectedRoute.toTokenSymbol
  );
  const swapToken = config.getTokenInfoBySymbolSafe(
    selectedRoute.fromChain,
    selectedRoute.type === "swap" ? selectedRoute.swapTokenSymbol : ""
  );

  return {
    depositId: Number(depositId),
    depositTime: data.depositTimestamp || Math.floor(Date.now() / 1000),
    status: "pending" as const,
    filled: "0",
    sourceChainId: selectedRoute.fromChain,
    destinationChainId: selectedRoute.toChain,
    assetAddr:
      selectedRoute.type === "swap"
        ? selectedRoute.swapTokenAddress
        : selectedRoute.fromTokenAddress,
    depositorAddr: depositor,
    recipientAddr: recipient,
    message: message || "0x",
    amount: BigNumber.from(inputAmount).toString(),
    depositTxHash: data.depositTxReceipt.transactionHash,
    fillTxs: [],
    speedUps: [],
    depositRelayerFeePct: BigNumber.from(depositArgs.relayerFeePct).toString(),
    initialRelayerFeePct: BigNumber.from(depositArgs.relayerFeePct).toString(),
    suggestedRelayerFeePct: BigNumber.from(
      depositArgs.relayerFeePct
    ).toString(),
    feeBreakdown: {
      lpFeeUsd: quoteForAnalytics.lpFeeTotalUsd,
      lpFeePct: quoteForAnalytics.lpFeePct,
      lpFeeAmount: quoteForAnalytics.lpFeeTotal,
      relayCapitalFeeUsd: quoteForAnalytics.capitalFeeTotalUsd,
      relayCapitalFeePct: quoteForAnalytics.capitalFeePct,
      relayCapitalFeeAmount: quoteForAnalytics.capitalFeeTotal,
      relayGasFeeUsd: quoteForAnalytics.relayGasFeeTotalUsd,
      relayGasFeePct: quoteForAnalytics.relayGasFeePct,
      relayGasFeeAmount: quoteForAnalytics.relayFeeTotal,
      totalBridgeFeeUsd: quoteForAnalytics.totalBridgeFeeUsd,
      totalBridgeFeePct: quoteForAnalytics.totalBridgeFeePct,
      totalBridgeFeeAmount: quoteForAnalytics.totalBridgeFee,
    },
    token: inputToken,
    outputToken,
    swapToken,
  };
}

export function convertForFillQuery(
  data: Awaited<ReturnType<typeof getFillByDepositTxHash>>,
  fromBridgePagePayload: FromBridgePagePayload
): Deposit {
  const { selectedRoute, depositArgs, quoteForAnalytics } =
    fromBridgePagePayload;
  const { depositId, depositor, recipient, message, inputAmount } =
    data.depositByTxHash.parsedDepositLog.args;
  const inputToken = config.getTokenInfoBySymbol(
    selectedRoute.fromChain,
    selectedRoute.fromTokenSymbol
  );
  const outputToken = config.getTokenInfoBySymbol(
    selectedRoute.toChain,
    selectedRoute.toTokenSymbol
  );
  const swapToken = config.getTokenInfoBySymbolSafe(
    selectedRoute.fromChain,
    selectedRoute.type === "swap" ? selectedRoute.swapTokenSymbol : ""
  );

  return {
    depositId: Number(depositId),
    depositTime:
      data.depositByTxHash.depositTimestamp || Math.floor(Date.now() / 1000),
    status: "filled" as const,
    filled: BigNumber.from(inputAmount).toString(),
    sourceChainId: selectedRoute.fromChain,
    destinationChainId: selectedRoute.toChain,
    assetAddr:
      selectedRoute.type === "swap"
        ? selectedRoute.swapTokenAddress
        : selectedRoute.fromTokenAddress,
    depositorAddr: depositor,
    recipientAddr: recipient,
    message: message || "0x",
    amount: BigNumber.from(inputAmount).toString(),
    depositTxHash: data.depositByTxHash.depositTxReceipt.transactionHash,
    fillTxs: data.fillTxHashes || [],
    speedUps: [],
    depositRelayerFeePct: BigNumber.from(depositArgs.relayerFeePct).toString(),
    initialRelayerFeePct: BigNumber.from(depositArgs.relayerFeePct).toString(),
    suggestedRelayerFeePct: BigNumber.from(
      depositArgs.relayerFeePct
    ).toString(),
    feeBreakdown: {
      lpFeeUsd: quoteForAnalytics.lpFeeTotalUsd,
      lpFeePct: quoteForAnalytics.lpFeePct,
      lpFeeAmount: quoteForAnalytics.lpFeeTotal,
      relayCapitalFeeUsd: quoteForAnalytics.capitalFeeTotalUsd,
      relayCapitalFeePct: quoteForAnalytics.capitalFeePct,
      relayCapitalFeeAmount: quoteForAnalytics.capitalFeeTotal,
      relayGasFeeUsd: quoteForAnalytics.relayGasFeeTotalUsd,
      relayGasFeePct: quoteForAnalytics.relayGasFeePct,
      relayGasFeeAmount: quoteForAnalytics.relayFeeTotal,
      totalBridgeFeeUsd: quoteForAnalytics.totalBridgeFeeUsd,
      totalBridgeFeePct: quoteForAnalytics.totalBridgeFeePct,
      totalBridgeFeeAmount: quoteForAnalytics.totalBridgeFee,
    },
    token: inputToken,
    outputToken,
    swapToken,
  };
}
