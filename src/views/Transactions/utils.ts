import { DateTime } from "luxon";
import { Transfer } from "@across-protocol/sdk-v2/dist/transfers-history";

import { Deposit } from "hooks/useDeposits";
import { getConfig } from "utils";

import { SupportedTxTuple } from "./types";
import { BigNumber } from "ethers";

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

export function formatToTransfer(deposit: Deposit): Transfer {
  return {
    depositId: deposit.depositId,
    depositTime: DateTime.fromISO(deposit.createdAt).toSeconds(),
    status: deposit.status,
    filled: BigNumber.from(deposit.filled),
    sourceChainId: deposit.sourceChainId,
    destinationChainId: deposit.destinationChainId,
    assetAddr: deposit.tokenAddr,
    amount: BigNumber.from(deposit.amount),
    depositTxHash: deposit.depositTxHash,
    fillTxs: deposit.fillTxs.map(({ hash }) => hash),
  };
}
