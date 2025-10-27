import { CHAIN_IDs } from "@across-protocol/constants";
import { ethers } from "ethers";

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
 * Check if AcrossEventEmitter is deployed on a given chain
 * @param chainId The chain ID
 * @returns True if the contract is deployed (non-zero address), false otherwise
 */
export function isEventEmitterDeployed(chainId: number): boolean {
  const address = getEventEmitterAddress(chainId);
  return !!address && address !== ethers.constants.AddressZero;
}

/**
 * Encodes metadata for destination swap events
 * @param version Metadata version (1 byte)
 * @param swapTokenAddress The token being swapped to (32 bytes)
 * @param swapTokenAmount The amount being swapped (32 bytes)
 * @param recipient The final recipient address (32 bytes)
 * @param appFeeRecipient The app fee recipient address (32 bytes, zero address if no app fee)
 * @param swapProvider The name of the swap provider (UTF-8 encoded, variable length)
 * @returns Encoded bytes
 */
export function encodeSwapMetadata(params: {
  version: number;
  swapTokenAddress: string;
  swapTokenAmount: ethers.BigNumberish;
  recipient: string;
  appFeeRecipient: string;
  swapProvider: string;
}): string {
  const {
    version,
    swapTokenAddress,
    swapTokenAmount,
    recipient,
    appFeeRecipient,
    swapProvider,
  } = params;

  const abiCoder = ethers.utils.defaultAbiCoder;

  // Encode the metadata as a packed bytes structure
  const encoded = abiCoder.encode(
    ["uint8", "address", "uint256", "address", "address", "string"],
    [
      version,
      swapTokenAddress,
      ethers.BigNumber.from(swapTokenAmount),
      recipient,
      appFeeRecipient,
      swapProvider,
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
