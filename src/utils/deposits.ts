import { DepositData } from "views/DepositStatus/hooks/useDepositTracking/types";
import { getProvider } from "./providers";
import { SpokePool__factory } from "./typechain";

import { TransactionReceipt } from "@ethersproject/providers";
import { FundsDepositedEvent, FilledRelayEvent } from "./typechain";
import { getMessageHash, toAddressType } from "./sdk";

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

export function parseFundsDepositedLog(
  logs: Array<{
    topics: string[];
    data: string;
  }>
): FundsDepositedEvent {
  const spokePoolIface = SpokePool__factory.createInterface();
  const parsedLogs = logs.flatMap((log) => {
    try {
      return spokePoolIface.parseLog(log);
    } catch (e) {
      return [];
    }
  });
  return parsedLogs.find(({ name }) =>
    [
      "V3FundsDeposited", // NOTE: kept for backwards compatibility
      "FundsDeposited", // NOTE: this is the new name for the event
    ].includes(name)
  ) as unknown as FundsDepositedEvent;
}

export function parseFilledRelayLog(
  logs: Array<{
    topics: string[];
    data: string;
  }>
): FilledRelayEvent | undefined {
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

  return parsedLogs.find(({ name }) =>
    [
      "FilledV3Relay", // NOTE: kept for backwards compatibility
      "FilledRelay", // NOTE: this is the new name for the event
    ].includes(name)
  ) as unknown as FilledRelayEvent;
}

export async function getDepositByTxHash(
  depositTxHash: string,
  fromChainId: number
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

  const parsedDepositLog = parseFundsDepositedLog(depositTxReceipt.logs);
  if (!parsedDepositLog) {
    throw new NoFundsDepositedLogError(depositTxHash, fromChainId);
  }

  return {
    depositTxReceipt,
    parsedDepositLog: {
      ...parsedDepositLog,
      ...parsedDepositLog.args,
      recipient: toAddressType(
        parsedDepositLog.args.recipient,
        Number(parsedDepositLog.args.destinationChainId)
      ),
      depositor: toAddressType(parsedDepositLog.args.depositor, fromChainId),
      exclusiveRelayer: toAddressType(
        parsedDepositLog.args.exclusiveRelayer,
        Number(parsedDepositLog.args.destinationChainId)
      ),
      inputToken: toAddressType(parsedDepositLog.args.inputToken, fromChainId),
      outputToken: toAddressType(
        parsedDepositLog.args.outputToken,
        Number(parsedDepositLog.args.destinationChainId)
      ),
      depositTimestamp: block.timestamp,
      originChainId: fromChainId,
      logIndex: parsedDepositLog.logIndex,
      messageHash: getMessageHash(parsedDepositLog.args.message),
      blockNumber: parsedDepositLog.blockNumber,
      txnIndex: parsedDepositLog.transactionIndex,
      txnRef: parsedDepositLog.transactionHash,
      destinationChainId: Number(parsedDepositLog.args.destinationChainId),
    } satisfies DepositData,
    depositTimestamp: block.timestamp,
  };
}
