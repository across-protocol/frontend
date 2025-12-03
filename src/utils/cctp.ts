import { BigNumber, ethers } from "ethers";

import {
  toAddressType,
  getCctpDestinationChainFromDomain,
  chainIsProd,
  SvmCpiEventsClient,
} from "./sdk";
import {
  DepositData,
  DepositForBurnEvent,
} from "views/DepositStatus/hooks/useDepositTracking/types";
import {
  TokenMessengerMinterV2Client,
  TokenMessengerMinterV2Idl,
} from "@across-protocol/contracts";

import type { Address, Signature } from "@solana/kit";
import { getProgramDerivedAddress } from "@solana/kit";
import { getSVMRpc } from "./providers";
import { CHAIN_IDs, PUBLIC_NETWORKS } from "@across-protocol/constants";
import { hubPoolChainId } from "./constants";

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

// ====================================================== //
// ========================= SVM ======================== //
// ====================================================== //

// minimal idl for DepositForBurn and its internal type
const TOKEN_MESSENGER_MINTER_V2_IDL = {
  name: "token_messenger_minter",
  events: [
    {
      name: "DepositForBurn",
      fields: [
        { name: "nonce", type: "u64", index: false },
        { name: "burnToken", type: "publicKey", index: false },
        { name: "amount", type: "u64", index: false },
        { name: "depositor", type: "publicKey", index: false },
        { name: "mintRecipient", type: "publicKey", index: false },
        { name: "destinationDomain", type: "u32", index: false },
        { name: "destinationTokenMessenger", type: "publicKey", index: false },
        { name: "destinationCaller", type: "publicKey", index: false },
      ],
    },
  ],
  types: [
    {
      name: "DepositForBurn",
      type: {
        kind: "struct",
        fields: [
          { name: "nonce", type: "u64" },
          { name: "burnToken", type: "publicKey" },
          { name: "amount", type: "u64" },
          { name: "depositor", type: "publicKey" },
          { name: "mintRecipient", type: "publicKey" },
          { name: "destinationDomain", type: "u32" },
          { name: "destinationTokenMessenger", type: "publicKey" },
          { name: "destinationCaller", type: "publicKey" },
        ],
      },
    },
  ],
} as const;

// events client for token messenger
export class SvmCctpEventsClient {
  private eventsClient: SvmCpiEventsClient;
  private cctpEventAuthority: Address;

  constructor(eventsClient: SvmCpiEventsClient, cctpEventAuthority: Address) {
    this.eventsClient = eventsClient;
    this.cctpEventAuthority = cctpEventAuthority;
  }

  static async create() {
    const chainId =
      hubPoolChainId === 1 ? CHAIN_IDs.SOLANA : CHAIN_IDs.SOLANA_DEVNET;

    const rpc = getSVMRpc(chainId);
    // get address
    const tokenMessengerAddress =
      TokenMessengerMinterV2Client.TOKEN_MESSENGER_MINTER_V2_PROGRAM_ADDRESS; // "CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe"

    const [eventAuthorityPda] = await getProgramDerivedAddress({
      programAddress: tokenMessengerAddress,
      seeds: ["__event_authority"],
    });

    // Create events client for TokenMessenger program
    const eventsClient = await SvmCpiEventsClient.createFor(
      rpc,
      tokenMessengerAddress,
      TokenMessengerMinterV2Idl
    );

    return new SvmCctpEventsClient(eventsClient, eventAuthorityPda);
  }

  async queryDepositForBurnEvents(fromSlot?: bigint, toSlot?: bigint) {
    return await this.eventsClient.queryEvents(
      "DepositForBurn" as any, // Maybe override queryEvents method
      fromSlot,
      toSlot,
      { limit: 1000, commitment: "confirmed" }
    );
  }

  async getDepositForBurnFromSignature(signature: Signature) {
    const events = await this.eventsClient.readEventsFromSignature(signature);
    console.log("all events", events);
    return events.filter((event) => event.name === "DepositForBurn");
  }
}

export async function getDepositForBurnBySignatureSVM(args: {
  signature: Signature;
  chainId: number;
}) {
  const { signature, chainId } = args;

  // init events client
  const eventsClient = await SvmCctpEventsClient.create();
  const rpc = getSVMRpc(chainId);
  const [depositForBurnEvents, depositTransaction] = await Promise.all([
    eventsClient.getDepositForBurnFromSignature(signature),
    rpc
      .getTransaction(signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      })
      .send(),
  ]);

  if (depositForBurnEvents?.length) {
    const event = depositForBurnEvents[0];
    const data = event.data as DepositForBurnEvent;
    const destinationChainId = Number(
      Object.entries(PUBLIC_NETWORKS).find(
        ([_, chain]) => chain.cctpDomain === data.destinationDomain
      )?.[0]
    );

    const blockTimestamp = Number(depositTransaction?.blockTime);

    // convert to normalized type for compatibility
    const convertedLog: DepositData = {
      depositId: BigNumber.from(0),
      depositTimestamp: blockTimestamp,
      originChainId: chainId,
      destinationChainId,
      depositor: toAddressType(data.depositor, chainId),
      recipient: toAddressType(data.mintRecipient, destinationChainId),
      exclusiveRelayer: toAddressType(
        ethers.constants.AddressZero,
        destinationChainId
      ),
      inputToken: toAddressType(data.burnToken, chainId),
      outputToken: toAddressType(data.burnToken, chainId),
      inputAmount: BigNumber.from(data.amount?.toString?.() ?? "0"),
      outputAmount: BigNumber.from(data.amount?.toString?.() ?? "0"),
      quoteTimestamp: blockTimestamp,
      fillDeadline: blockTimestamp,
      messageHash: "0x",
      message: "0x",
      exclusivityDeadline: 0,
      blockNumber: Number(depositTransaction?.slot),
      txnIndex: 0,
      txnRef: signature,
      logIndex: 0,
    };

    return convertedLog;
  }
}
