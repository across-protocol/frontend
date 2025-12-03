import { BigNumber, ethers } from "ethers";

import { toAddressType } from "./sdk";
import { DepositData } from "views/DepositStatus/hooks/useDepositTracking/types";
import { CHAIN_IDs, OFT_EIDS_BY_CHAIN_ID } from "./constants";
import { getConfig } from "./config";

// OFT messenger contract addresses per token per chain
export const OFT_MESSENGERS: Record<
  string,
  Record<number, string | undefined>
> = {
  // Source: https://docs.usdt0.to/technical-documentation/developer
  USDT: {
    [CHAIN_IDs.MAINNET]: "0x6C96dE32CEa08842dcc4058c14d3aaAD7Fa41dee",
    [CHAIN_IDs.ARBITRUM]: "0x14E4A1B13bf7F943c8ff7C51fb60FA964A298D92",
    [CHAIN_IDs.HYPEREVM]: "0x904861a24F30EC96ea7CFC3bE9EA4B476d237e98",
    [CHAIN_IDs.PLASMA]: "0x02ca37966753bDdDf11216B73B16C1dE756A7CF9",
    [CHAIN_IDs.POLYGON]: "0x6BA10300f0DC58B7a1e4c0e41f5daBb7D7829e13",
    [CHAIN_IDs.MONAD]: "0x9151434b16b9763660705744891fA906F660EcC5",
  },
};

const OFT_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "guid", type: "bytes32" },
      {
        indexed: false,
        internalType: "uint32",
        name: "dstEid",
        type: "uint32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "fromAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amountSentLD",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amountReceivedLD",
        type: "uint256",
      },
    ],
    name: "OFTSent",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "guid", type: "bytes32" },
      {
        indexed: false,
        internalType: "uint32",
        name: "srcEid",
        type: "uint32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "toAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amountReceivedLD",
        type: "uint256",
      },
    ],
    name: "OFTReceived",
    type: "event",
  },
];

export function getChainIdFromOftEid(eid: number): number {
  const chainIdEntry = Object.entries(OFT_EIDS_BY_CHAIN_ID).find(
    ([_, _eid]) => _eid === eid
  );
  if (!chainIdEntry) {
    throw new Error(`Unknown OFT EID ${eid}`);
  }
  return Number(chainIdEntry[0]);
}

export function parseOftSentLog(params: {
  logs: ethers.providers.Log[];
  originChainId: number;
  block: {
    timestamp: number;
    number: number;
  };
  depositTxReceipt: ethers.providers.TransactionReceipt;
}) {
  const { logs, originChainId, block, depositTxReceipt } = params;
  const oftIface = new ethers.utils.Interface(OFT_ABI);
  const parsedLogs = logs.flatMap((log) => {
    try {
      return oftIface.parseLog(log);
    } catch (e) {
      return [];
    }
  });
  const oftSentLog = parsedLogs.find(({ name }) => name === "OFTSent");
  if (!oftSentLog) {
    return undefined;
  }

  const destinationChainId = getChainIdFromOftEid(
    Number(oftSentLog.args.dstEid)
  );
  const originToken = getConfig().getTokenInfoBySymbolSafe(
    originChainId,
    "USDT"
  );
  const destinationToken = getConfig().getTokenInfoBySymbolSafe(
    destinationChainId,
    "USDT"
  );

  if (!originToken || !destinationToken) {
    throw new Error("USDT not found for origin or destination chain");
  }

  const convertedLog: DepositData = {
    depositId: BigNumber.from(0),
    originChainId,
    destinationChainId,
    depositor: toAddressType(oftSentLog.args.fromAddress, originChainId),
    // TODO: Correctly decode the recipient from payload if required. We use the same
    // address for both depositor and recipient for now.
    recipient: toAddressType(oftSentLog.args.fromAddress, destinationChainId),
    exclusiveRelayer: toAddressType(
      ethers.constants.AddressZero,
      destinationChainId
    ),
    inputToken: toAddressType(originToken.address, originChainId),
    outputToken: toAddressType(destinationToken.address, destinationChainId),
    inputAmount: BigNumber.from(oftSentLog.args.amountSentLD),
    outputAmount: BigNumber.from(oftSentLog.args.amountReceivedLD),
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

export function parseOutputAmountFromOftReceivedLog(
  logs: ethers.providers.Log[]
) {
  const oftIface = new ethers.utils.Interface(OFT_ABI);
  const parsedLogs = logs.flatMap((log) => {
    try {
      return oftIface.parseLog(log);
    } catch (e) {
      return [];
    }
  });

  const oftReceivedLog = parsedLogs.find(({ name }) => name === "OFTReceived");

  if (!oftReceivedLog) {
    return undefined;
  }

  return BigNumber.from(oftReceivedLog.args.amountReceivedLD);
}
