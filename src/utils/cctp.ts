import { BigNumber, ethers } from "ethers";

import {
  toAddressType,
  getCctpDestinationChainFromDomain,
  chainIsProd,
} from "./sdk";
import { DepositData } from "views/DepositStatus/hooks/useDepositTracking/types";

const CCTP_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "burnToken",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "depositor",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "mintRecipient",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint32",
        name: "destinationDomain",
        type: "uint32",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "destinationTokenMessenger",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "destinationCaller",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "maxFee",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint32",
        name: "minFinalityThreshold",
        type: "uint32",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "hookData",
        type: "bytes",
      },
    ],
    name: "DepositForBurn",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "mintRecipient",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "mintToken",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "feeCollected",
        type: "uint256",
      },
    ],
    name: "MintAndWithdraw",
    type: "event",
  },
];

export function parseDepositForBurnLog(params: {
  logs: ethers.providers.Log[];
  originChainId: number;
  block: {
    timestamp: number;
    number: number;
  };
  depositTxReceipt: ethers.providers.TransactionReceipt;
}) {
  const { logs, originChainId, block, depositTxReceipt } = params;
  const cctpIface = new ethers.utils.Interface(CCTP_ABI);
  const parsedLogs = logs.flatMap((log) => {
    try {
      return cctpIface.parseLog(log);
    } catch (e) {
      return [];
    }
  });
  const depositForBurnLog = parsedLogs.find(
    ({ name }) => name === "DepositForBurn"
  );
  if (!depositForBurnLog) {
    return undefined;
  }

  const destinationChainId = getCctpDestinationChainFromDomain(
    Number(depositForBurnLog.args.destinationDomain),
    chainIsProd(originChainId)
  );

  const convertedLog: DepositData = {
    depositId: BigNumber.from(0),
    originChainId,
    destinationChainId,
    depositor: toAddressType(depositForBurnLog.args.depositor, originChainId),
    // HyperCore recipient must be the HyperEVM depositor in initial Swap API support
    recipient: toAddressType(
      depositForBurnLog.args.mintRecipient,
      destinationChainId
    ),
    exclusiveRelayer: toAddressType(
      ethers.constants.AddressZero,
      destinationChainId
    ),
    inputToken: toAddressType(depositForBurnLog.args.burnToken, originChainId),
    outputToken: toAddressType(
      depositForBurnLog.args.burnToken,
      destinationChainId
    ),
    inputAmount: depositForBurnLog.args.amount,
    outputAmount: BigNumber.from(depositForBurnLog.args.amount).sub(
      depositForBurnLog.args.maxFee
    ),
    quoteTimestamp: block.timestamp,
    fillDeadline: block.timestamp,
    depositTimestamp: block.timestamp,
    messageHash: "0x",
    message: "0x",
    exclusivityDeadline: 0,
    blockNumber: block.number,
    txnIndex: depositTxReceipt.transactionIndex,
    logIndex: 0,
    txnRef: depositTxReceipt.transactionHash,
  };

  return convertedLog;
}

export function parseOutputAmountFromMintAndWithdrawLog(
  logs: ethers.providers.Log[]
) {
  const cctpIface = new ethers.utils.Interface(CCTP_ABI);
  const parsedLogs = logs.flatMap((log) => {
    try {
      return cctpIface.parseLog(log);
    } catch (e) {
      return [];
    }
  });

  const mintAndWithdrawLog = parsedLogs.find(
    ({ name }) => name === "MintAndWithdraw"
  );

  if (!mintAndWithdrawLog) {
    return undefined;
  }

  return BigNumber.from(mintAndWithdrawLog.args.amount);
}
