import { BigNumber } from "ethers";
import { CHAIN_IDs, CHAINS } from "../../../_constants";
import { InvalidParamError } from "../../../_errors";
import { toBytes32 } from "../../../_address";

// LayerZero Endpoint V2 addresses per chain
export const V2_ENDPOINTS: Record<number, string | undefined> = {
  [CHAIN_IDs.MAINNET]: "0x1a44076050125825900e736c501f859c50fE728c",
  [CHAIN_IDs.ARBITRUM]: "0x1a44076050125825900e736c501f859c50fE728c",
  [CHAIN_IDs.BASE]: "0x1a44076050125825900e736c501f859c50fE728c",
  [CHAIN_IDs.BSC]: "0x1a44076050125825900e736c501f859c50fE728c",
  [CHAIN_IDs.HYPEREVM]: "0x3A73033C0b1407574C76BdBAc67f126f6b4a9AA9",
  [CHAIN_IDs.INK]: "0xca29f3A6f966Cb2fc0dE625F8f325c0C46dbE958",
  [CHAIN_IDs.OPTIMISM]: "0x1a44076050125825900e736c501f859c50fE728c",
  [CHAIN_IDs.PLASMA]: "0x6F475642a6e85809B1c36Fa62763669b1b48DD5B",
  [CHAIN_IDs.POLYGON]: "0x1a44076050125825900e736c501f859c50fE728c",
  [CHAIN_IDs.SONEIUM]: "0x4bcb6a963a9563c33569d7a512d35754221f3a19",
  [CHAIN_IDs.UNICHAIN]: "0x6F475642a6e85809B1c36Fa62763669b1b48DD5B",
  [CHAIN_IDs.MONAD]: "0x6F475642a6e85809B1c36Fa62763669b1b48DD5B",
};

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
    // [CHAIN_IDs.INK]: "0x1cB6De532588fCA4a21B7209DE7C456AF8434A65", // TODO: Enable when we have intents support for Ink USDT
    [CHAIN_IDs.PLASMA]: "0x02ca37966753bDdDf11216B73B16C1dE756A7CF9",
    [CHAIN_IDs.POLYGON]: "0x6BA10300f0DC58B7a1e4c0e41f5daBb7D7829e13",
    [CHAIN_IDs.MONAD]: "0x9151434b16b9763660705744891fA906F660EcC5",
    // [CHAIN_IDs.UNICHAIN]: "0xc07bE8994D035631c36fb4a89C918CeFB2f03EC3", // TODO: Enable when we have intents support for Unichain USDT
  },
  // Source: https://docs.layerzero.network/v2/deployments & https://metadata.layerzero-api.com/v1/metadata/experiment/ofts/list?symbols=WBTC
  //  NOTE: Enable when we have intents support for Soneium, Unichain and BSC
  // WBTC: {
  //   [CHAIN_IDs.MAINNET]: "0x0555e30da8f98308edb960aa94c0db47230d2b9c",
  //   [CHAIN_IDs.BSC]: "0x0555e30da8f98308edb960aa94c0db47230d2b9c",
  //   [CHAIN_IDs.SONEIUM]: "0x0555e30da8f98308edb960aa94c0db47230d2b9c",
  //   [CHAIN_IDs.UNICHAIN]: "0x0555e30da8f98308edb960aa94c0db47230d2b9c",
  // }
};

// OFT composer contract addresses per token on hyperEVM
export const HYPEREVM_OFT_COMPOSER_ADDRESSES: Record<string, string> = {
  "USDT-SPOT": "0x80123ab57c9bc0c452d6c18f92a653a4ee2e7585",
};

// Shared decimals for OFT tokens across chains
// These are the decimal precision values that are consistent across all chains for each token
export const OFT_SHARED_DECIMALS: Record<string, number> = {
  USDT: 6,
  WBTC: 8,
};

// Origin chain confirmations required for OFT transfers per chain
// Source: https://layerzeroscan.com/tools/defaults
export const OFT_ORIGIN_CONFIRMATIONS: Record<number, number> = {
  [CHAIN_IDs.MAINNET]: 15,
  [CHAIN_IDs.ARBITRUM]: 20,
  [CHAIN_IDs.POLYGON]: 512,
  [CHAIN_IDs.OPTIMISM]: 20,
  [CHAIN_IDs.UNICHAIN]: 20,
  [CHAIN_IDs.INK]: 20,
  [CHAIN_IDs.HYPEREVM]: 1,
  [CHAIN_IDs.PLASMA]: 5,
  [CHAIN_IDs.BASE]: 10,
  [CHAIN_IDs.BSC]: 20,
  [CHAIN_IDs.SONEIUM]: 20,
};

// Default values for OFT fill time calculation
export const DEFAULT_OFT_ORIGIN_CONFIRMATIONS = 20;
export const DEFAULT_OFT_REQUIRED_DVNS = 2;

export const getOftOriginConfirmations = (chainId: number): number => {
  return OFT_ORIGIN_CONFIRMATIONS[chainId] ?? DEFAULT_OFT_ORIGIN_CONFIRMATIONS;
};

// Get OFT messenger contract address for a specific token on a specific chain
export const getOftMessengerForToken = (
  tokenSymbol: string,
  chainId: number
): string => {
  const chainAddresses = OFT_MESSENGERS[tokenSymbol];
  if (!chainAddresses) {
    throw new InvalidParamError({
      message: `OFT messenger contract not found for token ${tokenSymbol}`,
    });
  }

  const oftAddress = chainAddresses[chainId];
  if (!oftAddress) {
    throw new InvalidParamError({
      message: `OFT messenger contract not found for token ${tokenSymbol} on chain ID ${chainId}`,
    });
  }

  return oftAddress;
};

// Get OFT endpoint ID for a chain
export const getOftEndpointId = (chainId: number): number => {
  chainId = chainId === CHAIN_IDs.HYPERCORE ? CHAIN_IDs.HYPEREVM : chainId; // Use HyperEVM's OFT EID for Hypercore. They share the same EID.
  const chainInfo = CHAINS[chainId];
  if (!chainInfo || !chainInfo.oftEid) {
    throw new InvalidParamError({
      message: `OFT endpoint ID not found for chain ID ${chainId}`,
    });
  }
  return chainInfo.oftEid;
};

// OFT ABI (minimal - only methods we need)
export const OFT_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "uint32", name: "dstEid", type: "uint32" },
          { internalType: "bytes32", name: "to", type: "bytes32" },
          { internalType: "uint256", name: "amountLD", type: "uint256" },
          { internalType: "uint256", name: "minAmountLD", type: "uint256" },
          { internalType: "bytes", name: "extraOptions", type: "bytes" },
          { internalType: "bytes", name: "composeMsg", type: "bytes" },
          { internalType: "bytes", name: "oftCmd", type: "bytes" },
        ],
        internalType: "struct SendParam",
        name: "_sendParam",
        type: "tuple",
      },
      { internalType: "bool", name: "_payInLzToken", type: "bool" },
    ],
    name: "quoteSend",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "nativeFee", type: "uint256" },
          { internalType: "uint256", name: "lzTokenFee", type: "uint256" },
        ],
        internalType: "struct MessagingFee",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "uint32", name: "dstEid", type: "uint32" },
          { internalType: "bytes32", name: "to", type: "bytes32" },
          { internalType: "uint256", name: "amountLD", type: "uint256" },
          { internalType: "uint256", name: "minAmountLD", type: "uint256" },
          { internalType: "bytes", name: "extraOptions", type: "bytes" },
          { internalType: "bytes", name: "composeMsg", type: "bytes" },
          { internalType: "bytes", name: "oftCmd", type: "bytes" },
        ],
        internalType: "struct SendParam",
        name: "_sendParam",
        type: "tuple",
      },
    ],
    name: "quoteOFT",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "minAmountLD", type: "uint256" },
          { internalType: "uint256", name: "maxAmountLD", type: "uint256" },
        ],
        internalType: "struct OFTLimit",
        name: "",
        type: "tuple",
      },
      {
        components: [
          { internalType: "int256", name: "feeAmountLD", type: "int256" },
          { internalType: "string", name: "description", type: "string" },
        ],
        internalType: "struct OFTFeeDetail[]",
        name: "oftFeeDetails",
        type: "tuple[]",
      },
      {
        components: [
          { internalType: "uint256", name: "amountSentLD", type: "uint256" },
          {
            internalType: "uint256",
            name: "amountReceivedLD",
            type: "uint256",
          },
        ],
        internalType: "struct OFTReceipt",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "uint32", name: "dstEid", type: "uint32" },
          { internalType: "bytes32", name: "to", type: "bytes32" },
          { internalType: "uint256", name: "amountLD", type: "uint256" },
          { internalType: "uint256", name: "minAmountLD", type: "uint256" },
          { internalType: "bytes", name: "extraOptions", type: "bytes" },
          { internalType: "bytes", name: "composeMsg", type: "bytes" },
          { internalType: "bytes", name: "oftCmd", type: "bytes" },
        ],
        internalType: "struct SendParam",
        name: "_sendParam",
        type: "tuple",
      },
      {
        components: [
          { internalType: "uint256", name: "nativeFee", type: "uint256" },
          { internalType: "uint256", name: "lzTokenFee", type: "uint256" },
        ],
        internalType: "struct MessagingFee",
        name: "_fee",
        type: "tuple",
      },
      { internalType: "address", name: "_refundAddress", type: "address" },
    ],
    name: "send",
    outputs: [
      {
        components: [
          { internalType: "bytes32", name: "guid", type: "bytes32" },
          { internalType: "uint64", name: "nonce", type: "uint64" },
          {
            components: [
              { internalType: "uint256", name: "nativeFee", type: "uint256" },
              { internalType: "uint256", name: "lzTokenFee", type: "uint256" },
            ],
            internalType: "struct MessagingFee",
            name: "fee",
            type: "tuple",
          },
        ],
        internalType: "struct MessagingReceipt",
        name: "",
        type: "tuple",
      },
      {
        components: [
          { internalType: "uint256", name: "amountSentLD", type: "uint256" },
          {
            internalType: "uint256",
            name: "amountReceivedLD",
            type: "uint256",
          },
        ],
        internalType: "struct OFTReceipt",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "sharedDecimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
];

// Minimal ABI for LayerZero EndpointV2
export const ENDPOINT_ABI = [
  "function getSendLibrary(address oapp, uint32 dstEid) view returns (address)",
  "function getConfig(address oapp, address lib, uint32 eid, uint32 configType) view returns (bytes)",
];

// ConfigType 2 corresponds to ULN/DVN settings
export const CONFIG_TYPE_ULN = 2;

export type SendParamStruct = {
  dstEid: number;
  to: string; // bytes32
  amountLD: BigNumber;
  minAmountLD: BigNumber;
  extraOptions: string;
  composeMsg: string;
  oftCmd: string;
};

export const createSendParamStruct = (params: {
  destinationChainId: number;
  toAddress: string;
  amountLD: BigNumber;
  minAmountLD: BigNumber;
  composeMsg?: string;
  extraOptions?: string;
}): SendParamStruct => {
  const dstEid = getOftEndpointId(params.destinationChainId);
  return {
    dstEid,
    to: toBytes32(params.toAddress),
    amountLD: params.amountLD,
    minAmountLD: params.minAmountLD,
    extraOptions: params.extraOptions ?? "0x",
    composeMsg: params.composeMsg ?? "0x",
    oftCmd: "0x",
  };
};
