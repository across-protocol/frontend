import { CHAIN_IDs } from "../../../_constants";

/**
 * SponsoredOFTSrcPeriphery contract addresses per chain
 * TODO: Update with actual deployed addresses
 */
export const SPONSORED_OFT_SRC_PERIPHERY: Record<number, string | undefined> = {
  [CHAIN_IDs.MAINNET]: "0x0000000000000000000000000000000000000000", // TODO
  [CHAIN_IDs.ARBITRUM]: "0x1235Ac1010FeeC8ae22744f323416cBBE37feDbE", // TODO
  [CHAIN_IDs.HYPEREVM]: "0x0000000000000000000000000000000000000000", // TODO
  [CHAIN_IDs.POLYGON]: "0x0000000000000000000000000000000000000000", // TODO
};

/**
 * DstOFTHandler contract addresses per chain
 * TODO: Update with actual deployed addresses
 */
export const DST_OFT_HANDLER: Record<number, string | undefined> = {
  [CHAIN_IDs.HYPEREVM]: "0x0000000000000000000000000000000000000000", // TODO
};

/**
 * Default gas limits for LayerZero execution
 * @todo These are estimated values and should be updated based on actual gas usage of executed transactions
 */
export const DEFAULT_LZ_RECEIVE_GAS_LIMIT = 175_000;
export const DEFAULT_LZ_COMPOSE_GAS_LIMIT = 300_000;

/**
 * Supported input tokens for sponsored OFT flows
 */
export const SPONSORED_OFT_INPUT_TOKENS = ["USDT"];

/**
 * Supported output tokens for sponsored OFT flows
 */
export const SPONSORED_OFT_OUTPUT_TOKENS = ["USDT-SPOT", "USDC-SPOT"];

/**
 * Supported destination chains for sponsored OFT flows
 */
export const SPONSORED_OFT_DESTINATION_CHAINS = [CHAIN_IDs.HYPERCORE];
