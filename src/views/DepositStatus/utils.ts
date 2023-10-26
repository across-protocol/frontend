import { utils, BigNumber } from "ethers";

import { getDepositByTxHash, getFillByDepositTxHash } from "utils";

import { FromBridgePagePayload } from "./types";

export function convertForDepositQuery(
  data: Awaited<ReturnType<typeof getDepositByTxHash>>,
  fromBridgePagePayload: FromBridgePagePayload
) {
  const { sendDepositArgs, quote } = fromBridgePagePayload;

  return {
    depositId: Number(data.parsedDepositLog.args.depositId || 0),
    depositTime: data.depositTimestamp || Math.floor(Date.now() / 1000),
    status: "pending" as const,
    filled: "0",
    sourceChainId: sendDepositArgs.fromChain,
    destinationChainId: sendDepositArgs.toChain,
    assetAddr: sendDepositArgs.tokenAddress,
    depositorAddr: utils.getAddress(fromBridgePagePayload.account),
    recipientAddr: sendDepositArgs.toAddress,
    message: sendDepositArgs.message || "0x",
    amount: BigNumber.from(sendDepositArgs.amount).toString(),
    depositTxHash: data.depositTxReceipt.transactionHash || "0x",
    fillTxs: [],
    speedUps: [],
    depositRelayerFeePct: BigNumber.from(
      sendDepositArgs.relayerFeePct
    ).toString(),
    initialRelayerFeePct: BigNumber.from(
      sendDepositArgs.relayerFeePct
    ).toString(),
    suggestedRelayerFeePct: BigNumber.from(
      sendDepositArgs.relayerFeePct
    ).toString(),
    feeBreakdown: {
      bridgeFee: {
        pct: quote.totalBridgeFeePct,
        usd: quote.totalBridgeFeeUsd,
      },
      destinationGasFee: {
        pct: quote.relayGasFeePct,
        usd: quote.relayGasFeeTotalUsd,
      },
    },
  };
}

export function convertForFillQuery(
  data: Awaited<ReturnType<typeof getFillByDepositTxHash>>,
  fromBridgePagePayload: FromBridgePagePayload
) {
  const { sendDepositArgs, quote } = fromBridgePagePayload;

  return {
    depositId: Number(
      data.depositByTxHash.parsedDepositLog.args.depositId || 0
    ),
    depositTime:
      data.depositByTxHash.depositTimestamp || Math.floor(Date.now() / 1000),
    status: "filled" as const,
    filled: BigNumber.from(sendDepositArgs.amount).toString(),
    sourceChainId: sendDepositArgs.fromChain,
    destinationChainId: sendDepositArgs.toChain,
    assetAddr: sendDepositArgs.tokenAddress,
    depositorAddr: utils.getAddress(fromBridgePagePayload.account),
    recipientAddr: sendDepositArgs.toAddress,
    message: sendDepositArgs.message || "0x",
    amount: BigNumber.from(sendDepositArgs.amount).toString(),
    depositTxHash:
      data.depositByTxHash.depositTxReceipt.transactionHash || "0x",
    fillTxs: data.fillTxHashes || [],
    speedUps: [],
    depositRelayerFeePct: BigNumber.from(
      sendDepositArgs.relayerFeePct
    ).toString(),
    initialRelayerFeePct: BigNumber.from(
      sendDepositArgs.relayerFeePct
    ).toString(),
    suggestedRelayerFeePct: BigNumber.from(
      sendDepositArgs.relayerFeePct
    ).toString(),
    feeBreakdown: {
      bridgeFee: {
        pct: quote.totalBridgeFeePct,
        usd: quote.totalBridgeFeeUsd,
      },
      destinationGasFee: {
        pct: quote.relayGasFeePct,
        usd: quote.relayGasFeeTotalUsd,
      },
    },
  };
}
