import {
  BridgeProvider,
  DepositData,
} from "views/DepositStatus/hooks/useDepositTracking/types";
import { getProvider } from "./providers";
import { SpokePool__factory } from "./typechain";
import { getSpokepoolRevertReason } from "./errors";

import { TransactionReceipt, Log } from "@ethersproject/providers";
import {
  FundsDepositedEvent,
  FilledRelayEvent,
} from "@across-protocol/contracts/dist/typechain/contracts/SpokePool";
import { getMessageHash, toAddressType } from "./sdk";
import { parseDepositForBurnLog } from "./cctp";
import { Signature } from "@solana/kit";
import { getSVMRpc, shortenAddress, SvmCpiEventsClient } from "utils";
import { parseOftSentLog } from "./oft";

export class NoFundsDepositedLogError extends Error {
  constructor(depositTxHash: string, chainId: number) {
    super(
      `Could not parse log FundsDeposited in tx ${shortenAddress(depositTxHash, "...", 5)} on chain ${chainId}`
    );
  }
}

export class TransactionNotFoundError extends Error {
  constructor(depositTxHash: string, chainId: number) {
    super(
      `Transaction ${shortenAddress(depositTxHash, "...", 5)} not found on chain ${chainId}. It may have been dropped from the mempool or replaced.`
    );
  }
}

export class TransactionPendingError extends Error {
  constructor(depositTxHash: string, chainId: number) {
    super(
      `Transaction ${shortenAddress(depositTxHash, "...", 5)} is pending on chain ${chainId}. Receipt not available yet.`
    );
  }
}

export class TransactionFailedError extends Error {
  error?: string;
  formattedError?: string;

  constructor(
    depositTxHash: string,
    chainId: number,
    revertReason?: { error: string; formattedError: string } | null
  ) {
    const message = revertReason?.formattedError
      ? `Transaction ${shortenAddress(depositTxHash, "...", 5)} reverted on chain ${chainId}: ${revertReason.formattedError}`
      : `Transaction ${shortenAddress(depositTxHash, "...", 5)} reverted on chain ${chainId}.`;
    super(message);
    this.error = revertReason?.error;
    this.formattedError = revertReason?.formattedError;
  }
}

export class NoFilledRelayLogError extends Error {
  constructor(depositId: number, chainId: number) {
    super(
      `Couldn't find related FilledV3Relay or FilledRelay for Deposit #${depositId} on chain ${chainId}`
    );
  }
}

export function parseFundsDepositedLog(params: {
  logs: Log[];
  originChainId: number;
  block: {
    timestamp: number;
    number: number;
  };
  depositTxReceipt: TransactionReceipt;
}) {
  const { logs, originChainId, block, depositTxReceipt } = params;
  const spokePoolIface = SpokePool__factory.createInterface();
  const parsedLogs = logs.flatMap((log) => {
    try {
      return spokePoolIface.parseLog(log);
    } catch (e) {
      return [];
    }
  });
  const fundsDepositedLog = parsedLogs.find(({ name }) =>
    [
      "V3FundsDeposited", // NOTE: kept for backwards compatibility
      "FundsDeposited", // NOTE: this is the new name for the event
    ].includes(name)
  ) as unknown as FundsDepositedEvent;

  if (!fundsDepositedLog) {
    return undefined;
  }

  const depositData: DepositData = {
    depositId: fundsDepositedLog.args.depositId,
    originChainId,
    destinationChainId: Number(fundsDepositedLog.args.destinationChainId),
    depositor: toAddressType(fundsDepositedLog.args.depositor, originChainId),
    recipient: toAddressType(
      fundsDepositedLog.args.recipient,
      Number(fundsDepositedLog.args.destinationChainId)
    ),
    exclusiveRelayer: toAddressType(
      fundsDepositedLog.args.exclusiveRelayer,
      Number(fundsDepositedLog.args.destinationChainId)
    ),
    inputToken: toAddressType(fundsDepositedLog.args.inputToken, originChainId),
    outputToken: toAddressType(
      fundsDepositedLog.args.outputToken,
      Number(fundsDepositedLog.args.destinationChainId)
    ),
    inputAmount: fundsDepositedLog.args.inputAmount,
    outputAmount: fundsDepositedLog.args.outputAmount,
    quoteTimestamp: block.timestamp,
    fillDeadline: fundsDepositedLog.args.fillDeadline,
    exclusivityDeadline: fundsDepositedLog.args.exclusivityDeadline,
    messageHash: getMessageHash(fundsDepositedLog.args.message),
    message: fundsDepositedLog.args.message,
    depositTimestamp: block.timestamp,
    blockNumber: depositTxReceipt.blockNumber,
    txnIndex: depositTxReceipt.transactionIndex,
    logIndex: depositTxReceipt.logs.findIndex(
      (log) => log.transactionHash === depositTxReceipt.transactionHash
    ),
    txnRef: depositTxReceipt.transactionHash,
  };

  return depositData;
}

export function parseFilledRelayLogOutputAmount(logs: Log[]) {
  const spokePoolIface = SpokePool__factory.createInterface();
  const parsedLogs = logs.flatMap((log) => {
    try {
      return spokePoolIface.parseLog(log);
    } catch (e) {
      return [];
    }
  });

  if (!parsedLogs) {
    return undefined;
  }

  const filledRelayLog = parsedLogs.find(({ name }) =>
    [
      "FilledV3Relay", // NOTE: kept for backwards compatibility
      "FilledRelay", // NOTE: this is the new name for the event
    ].includes(name)
  ) as unknown as FilledRelayEvent;

  if (!filledRelayLog) {
    return undefined;
  }

  return filledRelayLog.args.outputAmount;
}

export async function getDepositByTxHash(
  depositTxHash: string,
  fromChainId: number,
  bridgeProvider: BridgeProvider
): Promise<{
  depositTxReceipt: TransactionReceipt;
  parsedDepositLog: DepositData;
  depositTimestamp: number;
}> {
  const fromProvider = getProvider(fromChainId);
  const depositTxReceipt =
    await fromProvider.getTransactionReceipt(depositTxHash);

  if (!depositTxReceipt) {
    let tx;
    try {
      tx = await fromProvider.getTransaction(depositTxHash);
    } catch {
      throw new TransactionNotFoundError(depositTxHash, fromChainId);
    }

    if (tx) {
      throw new TransactionPendingError(depositTxHash, fromChainId);
    }
    throw new TransactionNotFoundError(depositTxHash, fromChainId);
  }

  const block = await fromProvider.getBlock(depositTxReceipt.blockNumber);

  if (depositTxReceipt.status === 0) {
    // Tx Receipt exists but tx failed
    const revertReason = await getSpokepoolRevertReason(
      depositTxReceipt,
      fromChainId
    );
    throw new TransactionFailedError(depositTxHash, fromChainId, revertReason);
  }

  const parsedDepositLog = makeDepositLogParser(bridgeProvider)({
    logs: depositTxReceipt.logs,
    originChainId: fromChainId,
    block,
    depositTxReceipt,
  });

  if (!parsedDepositLog) {
    throw new NoFundsDepositedLogError(depositTxHash, fromChainId);
  }

  // success
  return {
    depositTxReceipt,
    parsedDepositLog,
    depositTimestamp: block.timestamp,
  };
}

function makeDepositLogParser(bridgeProvider: BridgeProvider) {
  if (["cctp", "sponsored-cctp"].includes(bridgeProvider)) {
    return parseDepositForBurnLog;
  }
  if (["oft", "sponsored-oft"].includes(bridgeProvider)) {
    return parseOftSentLog;
  }
  return parseFundsDepositedLog;
}

// ====================================================== //
// ========================= SVM ======================== //
// ====================================================== //

export async function getDepositBySignatureSVM(args: {
  signature: Signature;
  chainId: number;
}): Promise<DepositData | undefined> {
  const { signature, chainId } = args;

  const rpc = getSVMRpc(chainId);

  const eventsClient = await SvmCpiEventsClient.create(rpc);

  const depositEventsAtSignature =
    await eventsClient.getDepositEventsFromSignature(chainId, signature);

  const tx = depositEventsAtSignature?.[0];

  return tx ? (tx as DepositData) : undefined;
}
