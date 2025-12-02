import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../../../api/_constants";

export const USDC_ON_OPTIMISM = {
  address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.OPTIMISM],
  chainId: CHAIN_IDs.OPTIMISM,
  symbol: "USDC",
  decimals: TOKEN_SYMBOLS_MAP.USDC.decimals,
};

export const USDH_ON_HYPEREVM = {
  address: TOKEN_SYMBOLS_MAP.USDH.addresses[CHAIN_IDs.HYPEREVM],
  chainId: CHAIN_IDs.HYPEREVM,
  symbol: "USDH",
  decimals: TOKEN_SYMBOLS_MAP.USDH.decimals,
};

export const USDH_ON_HYPERCORE = {
  address: TOKEN_SYMBOLS_MAP["USDH-SPOT"].addresses[CHAIN_IDs.HYPERCORE],
  chainId: CHAIN_IDs.HYPERCORE,
  symbol: TOKEN_SYMBOLS_MAP["USDH-SPOT"].symbol,
  decimals: TOKEN_SYMBOLS_MAP["USDH-SPOT"].decimals,
};
