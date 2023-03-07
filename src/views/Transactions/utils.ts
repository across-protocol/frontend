import { Deposit } from "hooks/useDeposits";
import { getConfig } from "utils";

import { SupportedTxTuple } from "./types";
import { BigNumber } from "ethers";

export function getSupportedTxTuples(
  transactions: Deposit[]
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
    return (
      BigNumber.from(filledAmount).gt(0) &&
      BigNumber.from(filledAmount).lte(100)
    );
  });
}
