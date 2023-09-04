import { Deposit } from "hooks/useDeposits";
import { getConfig, disabledChainIds } from "utils";

import { SupportedTxTuple } from "./types";
import { BigNumber } from "ethers";

export function getSupportedTxTuples(
  transactions: Deposit[]
): SupportedTxTuple[] {
  const config = getConfig();
  return transactions.reduce((supported, tx) => {
    try {
      // Do not show transactions for disabled chains
      if (
        [tx.sourceChainId, tx.destinationChainId].some((chainId) =>
          disabledChainIds.includes(String(chainId))
        )
      ) {
        return supported;
      }
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
