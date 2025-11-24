import { CHAIN_IDs } from "@across-protocol/constants";
import { ethers } from "ethers";

/**
 * Swap type for metadata encoding
 */
export enum SwapType {
  EXACT_INPUT = 0,
  MIN_OUTPUT = 1,
  EXACT_OUTPUT = 2,
}

/**
 * Swap side for metadata encoding
 */
export enum SwapSide {
  ORIGIN_SWAP = 0,
  DESTINATION_SWAP = 1,
}

// AcrossEventEmitter contract addresses per chain
export const ACROSS_EVENT_EMITTER_ADDRESS: Record<number, string> = {
  [CHAIN_IDs.MAINNET]: "0xBF75133b48b0a42AB9374027902E83C5E2949034",
  [CHAIN_IDs.OPTIMISM]: "0xBF75133b48b0a42AB9374027902E83C5E2949034",
  [CHAIN_IDs.ARBITRUM]: "0xBF75133b48b0a42AB9374027902E83C5E2949034",
  [CHAIN_IDs.BASE]: "0xBF75133b48b0a42AB9374027902E83C5E2949034",
  [CHAIN_IDs.POLYGON]: "0xBF75133b48b0a42AB9374027902E83C5E2949034",
  [CHAIN_IDs.LINEA]: "0xBF75133b48b0a42AB9374027902E83C5E2949034",
  [CHAIN_IDs.MODE]: "0xBF75133b48b0a42AB9374027902E83C5E2949034",
  [CHAIN_IDs.BLAST]: "0xBF75133b48b0a42AB9374027902E83C5E2949034",
  [CHAIN_IDs.LISK]: "0xBF75133b48b0a42AB9374027902E83C5E2949034",
  [CHAIN_IDs.REDSTONE]: "0xBF75133b48b0a42AB9374027902E83C5E2949034",
  [CHAIN_IDs.SCROLL]: "0xBF75133b48b0a42AB9374027902E83C5E2949034",
  [CHAIN_IDs.ZORA]: "0xBF75133b48b0a42AB9374027902E83C5E2949034",
  [CHAIN_IDs.WORLD_CHAIN]: "0xBF75133b48b0a42AB9374027902E83C5E2949034",
  [CHAIN_IDs.INK]: "0xBF75133b48b0a42AB9374027902E83C5E2949034",
  [CHAIN_IDs.SONEIUM]: "0xBF75133b48b0a42AB9374027902E83C5E2949034",
  [CHAIN_IDs.UNICHAIN]: "0xBF75133b48b0a42AB9374027902E83C5E2949034",
  [CHAIN_IDs.BSC]: "0xBF75133b48b0a42AB9374027902E83C5E2949034",
  [CHAIN_IDs.PLASMA]: "0xBF75133b48b0a42AB9374027902E83C5E2949034",
  [CHAIN_IDs.ZK_SYNC]: "0x74a2966e23B61A360b1345eA359127aF325beC4C",
  [CHAIN_IDs.LENS]: "0x6AA1d7390C0B9F36f08503207985fEAE6C6a13Dc",
  [CHAIN_IDs.HYPEREVM]: "0xBF75133b48b0a42AB9374027902E83C5E2949034",
};

/**
 * Get the AcrossEventEmitter contract address for a given chain
 * @param chainId The chain ID
 * @returns The contract address or undefined if not deployed on that chain
 */
export function getEventEmitterAddress(chainId: number): string | undefined {
  return ACROSS_EVENT_EMITTER_ADDRESS[chainId];
}

/**
 * Encodes metadata for swap events
 * @param version Metadata version (1 byte)
 * @param type Swap type (EXACT_INPUT, MIN_OUTPUT, or EXACT_OUTPUT) (1 byte)
 * @param side Swap side (ORIGIN_SWAP or DESTINATION_SWAP) (1 byte)
 * @param address The token address (32 bytes)
 * @param maximumAmountIn The maximum amount in (32 bytes)
 * @param minAmountOut The minimum amount out (32 bytes)
 * @param expectedAmountOut The expected amount out (32 bytes)
 * @param expectedAmountIn The expected amount in (32 bytes)
 * @param swapProvider The name of the swap provider (UTF-8 encoded, variable length)
 * @param slippage The slippage tolerance in percentage (0-100, converted to basis points, 32 bytes)
 * @param autoSlippage Whether auto slippage was used (1 byte)
 * @param recipient The final recipient address (32 bytes)
 * @param appFeeRecipient The app fee recipient address (32 bytes, zero address if no app fee)
 * @returns Encoded bytes
 */
export function encodeSwapMetadata(params: {
  version: number;
  type: SwapType;
  side: SwapSide;
  address: string;
  maximumAmountIn: ethers.BigNumberish;
  minAmountOut: ethers.BigNumberish;
  expectedAmountOut: ethers.BigNumberish;
  expectedAmountIn: ethers.BigNumberish;
  swapProvider: string;
  slippage: ethers.BigNumberish;
  autoSlippage: boolean;
  recipient: string;
  appFeeRecipient: string;
}): string {
  const {
    version,
    type,
    side,
    address,
    maximumAmountIn,
    minAmountOut,
    expectedAmountOut,
    expectedAmountIn,
    swapProvider,
    slippage,
    autoSlippage,
    recipient,
    appFeeRecipient,
  } = params;

  const abiCoder = ethers.utils.defaultAbiCoder;

  // Encode the metadata as a packed bytes structure
  // Convert slippage percentage (0-100) to basis points (e.g., 0.5% -> 50 bps)
  const slippageBps =
    typeof slippage === "number" && slippage <= 100
      ? Math.round(slippage * 100)
      : slippage;

  const encoded = abiCoder.encode(
    [
      "uint8",
      "uint8",
      "uint8",
      "address",
      "uint256",
      "uint256",
      "uint256",
      "uint256",
      "string",
      "uint256",
      "bool",
      "address",
      "address",
    ],
    [
      version,
      type,
      side,
      address,
      ethers.BigNumber.from(maximumAmountIn),
      ethers.BigNumber.from(minAmountOut),
      ethers.BigNumber.from(expectedAmountOut),
      ethers.BigNumber.from(expectedAmountIn),
      swapProvider,
      ethers.BigNumber.from(slippageBps),
      autoSlippage,
      recipient,
      appFeeRecipient,
    ]
  );

  return encoded;
}

/**
 * Encodes calldata for calling AcrossEventEmitter.emitData
 * @param data The bytes data to emit
 * @returns Encoded calldata
 */
export function encodeEmitDataCalldata(data: string): string {
  const emitDataFunction = "function emitData(bytes calldata data)";
  const eventEmitterInterface = new ethers.utils.Interface([emitDataFunction]);
  return eventEmitterInterface.encodeFunctionData("emitData", [data]);
}
