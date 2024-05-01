import { BigNumber } from "ethers";

import { getDepositByTxHash, getFillByDepositTxHash } from "utils";
import { FromBridgePagePayload } from "views/Bridge/hooks/useBridgeAction";

export function convertForDepositQuery(
  data: Awaited<ReturnType<typeof getDepositByTxHash>>,
  fromBridgePagePayload: FromBridgePagePayload
) {
  const { selectedRoute, depositArgs, quoteForAnalytics } =
    fromBridgePagePayload;
  const { depositId, depositor, recipient, message, inputAmount } =
    data.parsedDepositLog.args;

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
  };
}

export function convertForFillQuery(
  data: Awaited<ReturnType<typeof getFillByDepositTxHash>>,
  fromBridgePagePayload: FromBridgePagePayload
) {
  const { selectedRoute, depositArgs, quoteForAnalytics } =
    fromBridgePagePayload;
  const { depositId, depositor, recipient, message, inputAmount } =
    data.depositByTxHash.parsedDepositLog.args;

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
  };
}
