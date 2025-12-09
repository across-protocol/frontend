import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../../_constants";

/**
 * SponsoredOFTSrcPeriphery contract addresses per chain
 * TODO: Update with actual deployed addresses
 */
export const SPONSORED_OFT_SRC_PERIPHERY: Record<number, string | undefined> = {
  [CHAIN_IDs.MAINNET]: "0x4607BceaF7b22cb0c46882FFc9fAB3c6efe66e5a",
  [CHAIN_IDs.ARBITRUM]: "0x2ac5Ee3796E027dA274fbDe84c82173a65868940",
};

/**
 * DstOFTHandler contract addresses per chain
 * TODO: Update with actual deployed addresses
 */
export const DST_OFT_HANDLER: Record<number, string | undefined> = {
  [CHAIN_IDs.HYPEREVM]: "0xc8786D517b4e224bB43985A38dBeF8588D7354CD",
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
export const SPONSORED_OFT_OUTPUT_TOKENS = ["USDT-SPOT", "USDC"];

/**
 * Supported destination chains for sponsored OFT flows
 */
export const SPONSORED_OFT_DESTINATION_CHAINS = [CHAIN_IDs.HYPERCORE];

/**
 * Final token per output token for sponsored OFT flows
 */
export const SPONSORED_OFT_FINAL_TOKEN_PER_OUTPUT_TOKEN: Record<
  string,
  (typeof TOKEN_SYMBOLS_MAP)[keyof typeof TOKEN_SYMBOLS_MAP]
> = {
  USDC: TOKEN_SYMBOLS_MAP.USDC,
  "USDT-SPOT": TOKEN_SYMBOLS_MAP.USDT,
};
