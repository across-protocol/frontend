import { getDeployedAddress } from "@across-protocol/contracts";

import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../../_constants";

export function getSponsoredOftSrcPeripheryAddress(
  chainId: number,
  throwIfNotFound: boolean = false
) {
  return getDeployedAddress(
    "SponsoredOFTSrcPeriphery",
    chainId,
    throwIfNotFound
  );
}

export function getSponsoredOftDstHandlerAddress(
  chainId: number,
  throwIfNotFound: boolean = false
) {
  return getDeployedAddress("DstOFTHandler", chainId, throwIfNotFound);
}

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

/**
 * Final token per output token for sponsored OFT flows
 */
export const SPONSORED_OFT_FINAL_TOKEN_PER_OUTPUT_TOKEN: Record<
  string,
  (typeof TOKEN_SYMBOLS_MAP)[keyof typeof TOKEN_SYMBOLS_MAP]
> = {
  "USDC-SPOT": TOKEN_SYMBOLS_MAP.USDC,
  "USDT-SPOT": TOKEN_SYMBOLS_MAP.USDT,
};
