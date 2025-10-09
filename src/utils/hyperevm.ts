import { ethers, BigNumber } from "ethers";

import { ChainId } from "./constants";
import { getDepositByTxHash } from "./deposits";
import { getProvider } from "./providers";
import { ERC20__factory, TransferEvent } from "./typechain";
import { toAddressType } from "./sdk";

import type {
  DepositData,
  DepositedInfo,
  FillInfo,
} from "views/DepositStatus/hooks/useDepositTracking/types";

export async function getDepositByTxHashToHyperCore(
  txHash: string,
  originChainId: number
): ReturnType<typeof getDepositByTxHash> {
  if (originChainId !== ChainId.HYPEREVM) {
    throw new Error(
      `Could not fetch HyperEVM deposit for origin chain ${originChainId}`
    );
  }
  const destinationChainId = ChainId.HYPERCORE;

  const provider = getProvider(originChainId);
  const depositTxReceipt = await provider.getTransactionReceipt(txHash);
  if (!depositTxReceipt) {
    throw new Error(
      `Could not fetch tx receipt for ${txHash} on chain ${originChainId}`
    );
  }

  const block = await provider.getBlock(depositTxReceipt.blockNumber);

  if (depositTxReceipt.status === 0) {
    return {
      depositTxReceipt,
      parsedDepositLog: undefined,
      depositTimestamp: block.timestamp,
    };
  }

  const transferLog = parseTransferLog(depositTxReceipt.logs);
  if (!transferLog) {
    throw new Error(`Could not parse 'Transfer' log for ${txHash}`);
  }

  // Convert HyperEVM deposit log to Across deposit log
  const parsedDepositLog: DepositData = {
    depositId: BigNumber.from(0),
    originChainId,
    destinationChainId,
    depositor: toAddressType(transferLog.args.from, originChainId),
    // HyperCore recipient must be the HyperEVM depositor in initial Swap API support
    recipient: toAddressType(transferLog.args.from, destinationChainId),
    exclusiveRelayer: toAddressType(
      ethers.constants.AddressZero,
      destinationChainId
    ),
    inputToken: toAddressType(transferLog.address, originChainId),
    // HyperCore output token is the system address on HyperEVM, i.e. to address of Transfer log
    outputToken: toAddressType(transferLog.args.to, destinationChainId),
    inputAmount: transferLog.args.value,
    outputAmount: transferLog.args.value,
    quoteTimestamp: block.timestamp,
    fillDeadline: block.timestamp,
    depositTimestamp: block.timestamp,
    messageHash: "0x",
    message: "0x",
    exclusivityDeadline: 0,
    blockNumber: depositTxReceipt.blockNumber,
    txnIndex: depositTxReceipt.transactionIndex,
    logIndex: transferLog.logIndex,
    txnRef: depositTxReceipt.transactionHash,
  };

  return {
    depositTxReceipt,
    parsedDepositLog,
    depositTimestamp: block.timestamp,
  };
}

export async function getFillForDepositToHyperCore(
  depositOnHyperEVM: DepositedInfo
): Promise<FillInfo> {
  // TODO: Use HyperCore API to check if bridge succeeded
  return {
    fillTxHash: depositOnHyperEVM.depositLog.txnRef,
    fillTxTimestamp: depositOnHyperEVM.depositTimestamp,
    depositInfo: depositOnHyperEVM,
    status: "filled",
    fillLog: {
      ...depositOnHyperEVM.depositLog,
      fillTimestamp: depositOnHyperEVM.depositTimestamp,
      relayer: depositOnHyperEVM.depositLog.depositor,
      repaymentChainId: depositOnHyperEVM.depositLog.originChainId,
      relayExecutionInfo: {
        updatedRecipient: depositOnHyperEVM.depositLog.recipient,
        updatedOutputAmount: depositOnHyperEVM.depositLog.outputAmount,
        updatedMessageHash: depositOnHyperEVM.depositLog.messageHash,
        fillType: 0, // FastFill
      },
    },
  };
}

function parseTransferLog(
  logs: Array<{
    topics: string[];
    data: string;
  }>
) {
  const erc20Iface = ERC20__factory.createInterface();
  const parsedLogs = logs.flatMap((log) => {
    try {
      console.log("log", log);
      const parsedLog = erc20Iface.parseLog(log);
      return parsedLog.name === "Transfer"
        ? {
            ...log,
            ...parsedLog,
          }
        : [];
    } catch (e) {
      return [];
    }
  });
  return parsedLogs.find(({ name }) => name === "Transfer") as unknown as
    | TransferEvent
    | undefined;
}
