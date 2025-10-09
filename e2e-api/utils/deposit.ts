import { Address, Hex, parseEventLogs, TransactionReceipt } from "viem";

import { e2eConfig } from "./config";
import { buildBaseSwapResponseJson } from "../../api/swap/_utils";
import { SpokePoolAbi } from "./abis";
import { handleTevmError } from "./tevm";

export type SwapQuoteResponse = Awaited<
  ReturnType<typeof buildBaseSwapResponseJson>
>;

export type SubmittedTxReceipts = Awaited<
  ReturnType<typeof executeApprovalAndDeposit>
>;

async function executeApprovalTxnsIfAny(swapQuote: SwapQuoteResponse) {
  const receipts: TransactionReceipt[] = [];
  if (!swapQuote.approvalTxns || swapQuote.approvalTxns.length === 0) {
    return receipts;
  }

  // Send approvals per their declared chain
  for (const tx of swapQuote.approvalTxns) {
    const signer = e2eConfig.getAccount("depositor");
    const client = e2eConfig.getClient(tx.chainId);

    const approvalCallResult = await client.tevmCall({
      to: tx.to as Address,
      data: tx.data as Hex,
      from: signer.address,
      addToBlockchain: true,
      onAfterMessage: handleTevmError,
    });
    await client.tevmMine({ blockCount: 1 });

    if (!approvalCallResult.txHash) {
      throw new Error("Approval call failed");
    }

    const approvalReceipt = await client.waitForTransactionReceipt({
      hash: approvalCallResult.txHash,
    });

    receipts.push(approvalReceipt);
  }
  return receipts;
}

export async function executeApprovalAndDeposit(swapQuote: SwapQuoteResponse) {
  const approvalReceipts = await executeApprovalTxnsIfAny(swapQuote);

  if (!swapQuote.swapTx) {
    throw new Error("swapQuote.swapTx is required");
  }

  const { chainId } = swapQuote.swapTx;
  const depositor = e2eConfig.getAccount("depositor");
  const client = e2eConfig.getClient(chainId);
  await client.tevmReady();
  const swapCallResult = await client.tevmCall({
    to: swapQuote.swapTx.to as Address,
    data: swapQuote.swapTx.data as Hex,
    value: BigInt(swapQuote.swapTx.value || 0),
    from: depositor.address,
    onAfterMessage: handleTevmError,
    addToBlockchain: true,
  });
  await client.tevmMine({ blockCount: 1 });

  if (!swapCallResult.txHash) {
    throw new Error("Swap call failed");
  }

  const swapReceipt = await client.waitForTransactionReceipt({
    hash: swapCallResult.txHash,
  });

  const depositEvents = parseEventLogs({
    eventName: "FundsDeposited",
    abi: SpokePoolAbi,
    logs: swapReceipt.logs,
  });

  if (!depositEvents || depositEvents.length === 0) {
    throw new Error("No deposit event found");
  }

  if (depositEvents.length > 1) {
    throw new Error("Multiple deposit events found");
  }

  return { approvalReceipts, swapReceipt, depositEvent: depositEvents[0] };
}
