import {
  Address,
  Hex,
  parseEventLogs,
  parseGwei,
  serializeTransaction,
  TransactionReceipt,
  TransactionSerializable,
  parseAbi,
} from "viem";

import { e2eConfig } from "./config";
import { buildBaseSwapResponseJson } from "../../api/swap/_utils";
import { SpokePoolAbi } from "./abis";

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
    await client.tevmReady();

    const txHash = await client.sendTransaction({
      to: tx.to as Address,
      data: tx.data as Hex,
      account: signer,
      gas: 500_000n,
    });
    console.log("txHash", txHash);
    await client.mine({ blocks: 1 });
    const receipt = await client.waitForTransactionReceipt({
      hash: txHash,
    });
    console.log("receipt", receipt);

    const test = await client.readContract({
      address: tx.to as Address,
      abi: parseAbi(["function allowance(address,address) returns (uint256)"]),
      functionName: "allowance",
      args: [signer.address, swapQuote.swapTx.to as Address],
    });
    console.log("test", test);

    receipts.push(receipt);
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

  const txHash = await client.sendTransaction({
    to: swapQuote.swapTx.to as Address,
    data: swapQuote.swapTx.data as Hex,
    value: BigInt(swapQuote.swapTx.value || 0),
    account: depositor,
    gas: 1_000_000n,
  });
  console.log("deposit tx hash", txHash);

  await client.tevmMine();
  const code = await client.getCode({
    address: swapQuote.swapTx.to as Address,
  });
  console.log("code", code);

  const swapReceipt = await client.waitForTransactionReceipt({
    hash: txHash,
  });
  console.log("deposit receipt", swapReceipt);
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
