import {
  address,
  AccountRole,
  pipe,
  appendTransactionMessageInstruction,
} from "@solana/kit";
import { JupiterIx, JupiterSwapIxs } from "./api";

/**
 * Convert Jupiter instruction format to @solana/kit format
 */
export function deserializeJupiterIx(ix: JupiterIx) {
  return {
    programAddress: address(ix.programId),
    accounts: ix.accounts.map((acc) => ({
      address: address(acc.pubkey),
      role: acc.isWritable
        ? acc.isSigner
          ? AccountRole.WRITABLE_SIGNER
          : AccountRole.WRITABLE
        : acc.isSigner
          ? AccountRole.READONLY_SIGNER
          : AccountRole.READONLY,
    })),
    data: new Uint8Array(Buffer.from(ix.data, "base64")),
  };
}

/**
 * Convert all Jupiter instructions to @solana/kit format for transaction building
 */
export function processJupiterIxs(jupiterResponse: JupiterSwapIxs) {
  return {
    computeBudgetIxs:
      jupiterResponse.computeBudgetInstructions.map(deserializeJupiterIx),
    setupIxs: jupiterResponse.setupInstructions.map(deserializeJupiterIx),
    tokenLedgerIx: jupiterResponse.tokenLedgerInstruction
      ? deserializeJupiterIx(jupiterResponse.tokenLedgerInstruction)
      : undefined,
    swapIx: deserializeJupiterIx(jupiterResponse.swapInstruction),
    cleanupIx: jupiterResponse.cleanupInstruction
      ? deserializeJupiterIx(jupiterResponse.cleanupInstruction)
      : undefined,
  };
}

/**
 * Append Jupiter swap instructions to a base transaction
 */
export function appendJupiterIxs(baseTxn: any, ixs: JupiterSwapIxs) {
  const processedIxs = processJupiterIxs(ixs);
  const txn = pipe(
    baseTxn,
    // NOTE: Order matters when appending instructions
    (tx) =>
      processedIxs.computeBudgetIxs.reduce(
        (acc, ix) => appendTransactionMessageInstruction(ix, acc),
        tx
      ),
    (tx) =>
      processedIxs.setupIxs.reduce(
        (acc, ix) => appendTransactionMessageInstruction(ix, acc),
        tx
      ),
    (tx) =>
      processedIxs.tokenLedgerIx
        ? appendTransactionMessageInstruction(processedIxs.tokenLedgerIx, tx)
        : tx,
    (tx) => appendTransactionMessageInstruction(processedIxs.swapIx, tx),
    (tx) =>
      processedIxs.cleanupIx
        ? appendTransactionMessageInstruction(processedIxs.cleanupIx, tx)
        : tx
  );
  return txn;
}
