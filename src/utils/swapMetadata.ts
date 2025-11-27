import { ethers, providers } from "ethers";

export const metadataEmittedEventTopic =
  "0xc28009f405f9b451f5155492167b1ad5ab376d991bea880cb5049e924e5b823c";

export enum SwapSide {
  ORIGIN_SWAP = 0,
  DESTINATION_SWAP = 1,
}

export enum SwapType {
  EXACT_INPUT = 0,
  MIN_OUTPUT = 1,
  EXACT_OUTPUT = 2,
}

export type SwapMetaData = {
  version: `${number}`;
  type: SwapType;
  side: SwapSide;
  outputToken: string;
  maximumAmountIn: string; // BN string
  minAmountOut: string; // BN string
  expectedAmountOut: string; // BN string
  expectedAmountIn: string; // BN string
  swapProvider: string; // eg. "UniswapV3",
  slippage: string; // eg. "500" === 5% in basis points
  autoSlippage: boolean;
  recipient: string;
  appFeeRecipient: string | undefined;
};

export const METADATA_EMITTED_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "MetadataEmitted",
    type: "event",
  },
] as const;

export interface SwapMetadataEvent extends providers.Log {
  args: {
    data: string; // bytes data containing encoded swap metadata
  };
}

export async function findSwapMetaDataEventsFromTxReceipt(
  txReceipt: ethers.providers.TransactionReceipt
): Promise<SwapMetaData[] | undefined> {
  const contract = new ethers.utils.Interface(METADATA_EMITTED_ABI);

  const parsedLogs = txReceipt.logs.flatMap((log) => {
    try {
      if (log.topics[0] !== metadataEmittedEventTopic) {
        return [];
      }
      return contract.parseLog(log);
    } catch (e) {
      return [];
    }
  });

  if (!parsedLogs?.length) {
    console.error(
      `Event: MetaDataEmitted not found in tx with hash: ${txReceipt.transactionHash}.`
    );
    return undefined;
  }

  return parsedLogs.map((log) => {
    const data = log.args.data as string;
    return decodeMetadataEmitted(data);
  });
}

export async function findSwapMetaDataEventsFromTxHash(
  txHash: string,
  provider: ethers.providers.JsonRpcProvider
): Promise<SwapMetaData[] | undefined> {
  const txReceipt = await provider.getTransactionReceipt(txHash);
  return findSwapMetaDataEventsFromTxReceipt(txReceipt);
}

// MetadataEmitted only emits bytes, so we need to decode this manually.
function decodeMetadataEmitted(data: string) {
  const abiCoder = ethers.utils.defaultAbiCoder;

  try {
    const decoded = abiCoder.decode(
      [
        "uint8", // version
        "uint8", // type
        "uint8", // side
        "address", // outputToken address
        "uint256", // maximumAmountIn
        "uint256", // minAmountOut
        "uint256", // expectedAmountOut
        "uint256", // expectedAmountIn
        "string", // swapProvider
        "uint256", // slippage (in basis points)
        "bool", // autoSlippage
        "address", // recipient
        "address", // appFeeRecipient
      ],
      data
    );

    return {
      version: decoded[0],
      type: decoded[1],
      side: decoded[2],
      outputToken: decoded[3],
      maximumAmountIn: decoded[4],
      minAmountOut: decoded[5],
      expectedAmountOut: decoded[6],
      expectedAmountIn: decoded[7],
      swapProvider: decoded[8],
      slippage: decoded[9], // This is in basis points, so 100 = 1%
      autoSlippage: decoded[10],
      recipient: decoded[11],
      appFeeRecipient:
        decoded[12] === ethers.constants.AddressZero ? null : decoded[12],
    } as SwapMetaData;
  } catch (error) {
    console.error({
      at: "SwapMetadata#decodeMetadataEmitted",
      message: "Failed to decode swap metadata",
      error: error instanceof Error ? error.message : String(error),
      data,
    });
    throw error;
  }
}
