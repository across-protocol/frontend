import { Transfer } from "@across-protocol/sdk-v2/dist/transfers-history";

import { Deposit } from "hooks/useDeposits";
import { getConfig, parseEtherLike } from "utils";

import { SupportedTxTuple } from "./types";
import { BigNumber } from "ethers";
import { DateTime } from "luxon";

export function getSupportedTxTuples(
  transactions: Transfer[]
): SupportedTxTuple[] {
  const config = getConfig();
  return transactions.reduce((supported, tx) => {
    try {
      // this can error out if there are transactions with new tokens not added to routes, ie we cant lookup by address
      const token = config.getTokenInfoByAddress(
        tx.sourceChainId,
        tx.assetAddr
      );
      supported.push([token, tx]);
    } catch (err) {
      console.warn("transaction with unknown token", err, tx);
    }
    return supported;
  }, [] as SupportedTxTuple[]);
}

export function doPartialFillsExist(pendingTransferTuples: SupportedTxTuple[]) {
  return pendingTransferTuples.some(([, transfer]) => {
    const filledAmount = transfer.filled;
    return filledAmount.gt(0) && filledAmount.lte(100);
  });
}

/**
 * @todo Use proper values for `initialRelayerFeePct`, `currentRelayerFeePct`
 * and `speedUps` instead of placeholders.
 */
export function formatToTransfer(deposit: Deposit): Transfer {
  return {
    ...deposit,
    filled: BigNumber.from(deposit.filled),
    amount: BigNumber.from(deposit.amount),
    // replace with proper values if scraper-api supports relayer fee
    initialRelayerFeePct: BigNumber.from(0),
    currentRelayerFeePct: BigNumber.from(0),
    speedUps: [],
  };
}

export function isUnprofitable(
  depositTime: number,
  currentRelayerFeePct: BigNumber,
  thresholds: Partial<{
    hours: number;
    basisPoints: number;
  }> = {}
): boolean {
  const { hours = 24, basisPoints = 1 } = thresholds;
  const isPendingTooLong =
    Math.abs(DateTime.fromSeconds(depositTime).diffNow().as("hours")) > hours;
  const hasTooLowRelayerFee = currentRelayerFeePct.lt(
    parseEtherLike(String(basisPoints * 0.0001))
  );

  return isPendingTooLong || hasTooLowRelayerFee;
}
