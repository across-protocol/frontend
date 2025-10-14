import { BigNumber, ethers } from "ethers";
import { CCTP_NO_DOMAIN } from "@across-protocol/constants";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP, CHAINS } from "../../../_constants";
import { InvalidParamError } from "../../../_errors";
import { toBytes32 } from "../../../_address";

export const CCTP_SUPPORTED_CHAINS = [
  CHAIN_IDs.MAINNET,
  CHAIN_IDs.ARBITRUM,
  CHAIN_IDs.BASE,
  CHAIN_IDs.HYPERCORE,
  CHAIN_IDs.HYPEREVM,
  CHAIN_IDs.INK,
  CHAIN_IDs.OPTIMISM,
  CHAIN_IDs.POLYGON,
  CHAIN_IDs.SOLANA,
  CHAIN_IDs.UNICHAIN,
  CHAIN_IDs.WORLD_CHAIN,
  // Testnets
  CHAIN_IDs.HYPEREVM_TESTNET,
  CHAIN_IDs.HYPERCORE_TESTNET,
];

export const CCTP_SUPPORTED_TOKENS = [TOKEN_SYMBOLS_MAP.USDC];

export const getCctpDomainId = (chainId: number): number => {
  const chainInfo = CHAINS[chainId];
  if (!chainInfo || chainInfo.cctpDomain === CCTP_NO_DOMAIN) {
    throw new InvalidParamError({
      message: `CCTP domain not found for chain ID ${chainId}`,
    });
  }
  return chainInfo.cctpDomain;
};

export const CCTP_FINALITY_THRESHOLDS = {
  fast: 1000,
  standard: 2000,
};

// CCTP TokenMessenger contract addresses
// Source: https://developers.circle.com/cctp/evm-smart-contracts
const DEFAULT_CCTP_TOKEN_MESSENGER_ADDRESS =
  "0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d";

// Source: https://developers.circle.com/cctp/solana-programs
const CCTP_TOKEN_MESSENGER_ADDRESS_OVERRIDES: Record<number, string> = {
  [CHAIN_IDs.SOLANA]: "CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe",
};

export const getCctpTokenMessengerAddress = (chainId: number): string => {
  return (
    CCTP_TOKEN_MESSENGER_ADDRESS_OVERRIDES[chainId] ||
    DEFAULT_CCTP_TOKEN_MESSENGER_ADDRESS
  );
};

// CCTP TokenMessenger depositForBurn ABI
const CCTP_DEPOSIT_FOR_BURN_ABI = {
  inputs: [
    {
      internalType: "uint256",
      name: "amount",
      type: "uint256",
    },
    {
      internalType: "uint32",
      name: "destinationDomain",
      type: "uint32",
    },
    {
      internalType: "bytes32",
      name: "mintRecipient",
      type: "bytes32",
    },
    {
      internalType: "address",
      name: "burnToken",
      type: "address",
    },
    {
      internalType: "bytes32",
      name: "destinationCaller",
      type: "bytes32",
    },
    {
      internalType: "uint256",
      name: "maxFee",
      type: "uint256",
    },
    {
      internalType: "uint32",
      name: "minFinalityThreshold",
      type: "uint32",
    },
  ],
  name: "depositForBurn",
  outputs: [],
  stateMutability: "nonpayable",
  type: "function",
};

export const encodeDepositForBurn = (params: {
  amount: BigNumber;
  destinationDomain: number;
  mintRecipient: string;
  burnToken: string;
  destinationCaller: string;
  maxFee: BigNumber; // use 0 for standard transfer
  minFinalityThreshold: number; // use 2000 for standard transfer
}): string => {
  const iface = new ethers.utils.Interface([CCTP_DEPOSIT_FOR_BURN_ABI]);

  return iface.encodeFunctionData("depositForBurn", [
    params.amount,
    params.destinationDomain,
    toBytes32(params.mintRecipient),
    params.burnToken,
    toBytes32(params.destinationCaller),
    params.maxFee,
    params.minFinalityThreshold,
  ]);
};

// CCTP estimated fill times in seconds
// Soruce: https://developers.circle.com/cctp/required-block-confirmations
export const CCTP_FILL_TIME_ESTIMATES: Record<number, number> = {
  [CHAIN_IDs.MAINNET]: 19 * 60,
  [CHAIN_IDs.ARBITRUM]: 19 * 60,
  [CHAIN_IDs.BASE]: 19 * 60,
  [CHAIN_IDs.HYPEREVM]: 5,
  [CHAIN_IDs.INK]: 30 * 60,
  [CHAIN_IDs.OPTIMISM]: 19 * 60,
  [CHAIN_IDs.POLYGON]: 8,
  [CHAIN_IDs.SOLANA]: 25,
  [CHAIN_IDs.UNICHAIN]: 19 * 60,
  [CHAIN_IDs.WORLD_CHAIN]: 19 * 60,
};
