import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../../_constants";

/**
 * SponsoredOFTSrcPeriphery contract addresses per chain
 * TODO: Update with actual deployed addresses
 */
export const SPONSORED_OFT_SRC_PERIPHERY: Record<number, string | undefined> = {
  [CHAIN_IDs.MAINNET]: "0xE35d1205a523B699785967FFfe99b72059B46707",
  [CHAIN_IDs.ARBITRUM]: "0xcC0A3e41304c43BD13f520d300f0c2F8B17ABe7B",
};

/**
 * DstOFTHandler contract addresses per chain
 * TODO: Update with actual deployed addresses
 */
export const DST_OFT_HANDLER: Record<number, string | undefined> = {
  [CHAIN_IDs.HYPEREVM]: "0xd9f40794367a2EcB0B409Ca8DBc55345c0dB6E9F",
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
