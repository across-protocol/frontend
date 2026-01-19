import { Deposit, IndexerDeposit } from "hooks/useDeposits";

export function convertIndexerDepositToDeposit(
  indexerDeposit: IndexerDeposit
): Deposit {
  const depositTime =
    new Date(indexerDeposit.depositBlockTimestamp).getTime() / 1000;
  const fillTime = new Date(indexerDeposit.fillBlockTimestamp).getTime() / 1000;
  const status =
    indexerDeposit.status === "unfilled" ? "pending" : indexerDeposit.status;

  return {
    depositId: indexerDeposit.depositId,
    depositTime,
    fillTime,
    status,
    filled: "0",

    sourceChainId: indexerDeposit.originChainId,
    destinationChainId: indexerDeposit.destinationChainId,
    assetAddr: indexerDeposit.inputToken,
    depositorAddr: indexerDeposit.depositor,
    recipientAddr: indexerDeposit.recipient,

    depositTxHash:
      indexerDeposit.depositTransactionHash || indexerDeposit.depositTxHash,
    fillTx: indexerDeposit.fillTx,
    depositRefundTxHash: indexerDeposit.depositRefundTxHash,

    amount: indexerDeposit.inputAmount,
    message: indexerDeposit.message,
    token: {
      address: indexerDeposit.inputToken,
      symbol: undefined,
      name: undefined,
      decimals: undefined,
    },
    outputToken: {
      address: indexerDeposit.outputToken,
      symbol: undefined,
      name: undefined,
      decimals: undefined,
    },
    swapToken: {
      address: indexerDeposit.swapToken,
      symbol: undefined,
      name: undefined,
      decimals: undefined,
    },
    swapTokenAmount: indexerDeposit.swapTokenAmount,
    swapTokenAddress: indexerDeposit.swapToken,

    speedUps: indexerDeposit.speedups,
    fillDeadline: indexerDeposit.fillDeadline,

    depositRelayerFeePct: "0",
    initialRelayerFeePct: "0",
    suggestedRelayerFeePct: "0",
    rewards: undefined,
    feeBreakdown: indexerDeposit.bridgeFeeUsd
      ? {
          lpFeeUsd: "0",
          lpFeePct: "0",
          lpFeeAmount: "0",
          relayCapitalFeeUsd: "0",
          relayCapitalFeePct: "0",
          relayCapitalFeeAmount: "0",
          relayGasFeeUsd: indexerDeposit.fillGasFeeUsd,
          relayGasFeePct: "0",
          relayGasFeeAmount: "0",
          totalBridgeFeeUsd: indexerDeposit.bridgeFeeUsd,
          totalBridgeFeePct: "0",
          totalBridgeFeeAmount: "0",
          swapFeeUsd: indexerDeposit.swapFeeUsd,
          swapFeePct: "0",
          swapFeeAmount: "0",
        }
      : undefined,
  };
}
