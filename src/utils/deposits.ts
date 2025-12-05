import {
  BridgeProvider,
  DepositData,
} from "views/DepositStatus/hooks/useDepositTracking/types";
import { getProvider } from "./providers";
import { SpokePool__factory } from "./typechain";

import { TransactionReceipt, Log } from "@ethersproject/providers";
import {
  FundsDepositedEvent,
  FilledRelayEvent,
} from "@across-protocol/contracts/dist/typechain/contracts/SpokePool";
import { getMessageHash, toAddressType } from "./sdk";
import { parseDepositForBurnLog } from "./cctp";
import { Signature } from "@solana/kit";
import { getSVMRpc, SvmCpiEventsClient } from "utils";
import { parseOftSentLog } from "./oft";

export class NoFundsDepositedLogError extends Error {
  constructor(depositTxHash: string, chainId: number) {
    super(
      `Could not parse log FundsDeposited in tx ${depositTxHash} on chain ${chainId}`
    );
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
): Promise<
  | {
      depositTxReceipt: TransactionReceipt;
      parsedDepositLog: DepositData;
      depositTimestamp: number;
    }
  | {
      depositTxReceipt: TransactionReceipt;
      parsedDepositLog: undefined;
      depositTimestamp: number;
    }
> {
  const fromProvider = getProvider(fromChainId);
  const depositTxReceipt =
    await fromProvider.getTransactionReceipt(depositTxHash);
  if (!depositTxReceipt) {
    throw new Error(
      `Could not fetch tx receipt for ${depositTxHash} on chain ${fromChainId}`
    );
  }

  const block = await fromProvider.getBlock(depositTxReceipt.blockNumber);

  if (depositTxReceipt.status === 0) {
    return {
      depositTxReceipt,
      parsedDepositLog: undefined,
      depositTimestamp: block.timestamp,
    };
  }

  const parseDepositLogArgs = {
    logs: depositTxReceipt.logs,
    originChainId: fromChainId,
    block,
    depositTxReceipt,
  };
  const parsedDepositLog =
    bridgeProvider === "cctp"
      ? parseDepositForBurnLog(parseDepositLogArgs)
      : bridgeProvider === "oft"
        ? parseOftSentLog(parseDepositLogArgs)
        : parseFundsDepositedLog(parseDepositLogArgs);

  if (!parsedDepositLog) {
    throw new NoFundsDepositedLogError(depositTxHash, fromChainId);
  }

  return {
    depositTxReceipt,
    parsedDepositLog,
    depositTimestamp: block.timestamp,
  };
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
