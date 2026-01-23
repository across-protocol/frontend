import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../../../api/_constants";

export const USDC_ON_OPTIMISM = {
  address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.OPTIMISM],
  chainId: CHAIN_IDs.OPTIMISM,
  symbol: "USDC",
  decimals: TOKEN_SYMBOLS_MAP.USDC.decimals,
};

export const USDC_ON_SCROLL = {
  address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.SCROLL],
  chainId: CHAIN_IDs.SCROLL,
  symbol: "USDC",
  decimals: TOKEN_SYMBOLS_MAP.USDC.decimals,
};

export const USDC_ON_LENS = {
  address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.LENS],
  chainId: CHAIN_IDs.LENS,
  symbol: "USDC",
  decimals: TOKEN_SYMBOLS_MAP.USDC.decimals,
};

export const USDCe_ON_ZKSYNC = {
  address: TOKEN_SYMBOLS_MAP["USDC.e"].addresses[CHAIN_IDs.ZK_SYNC],
  chainId: CHAIN_IDs.ZK_SYNC,
  symbol: "USDC.e",
  decimals: TOKEN_SYMBOLS_MAP["USDC.e"].decimals,
};

export const USDzC_ON_ZORA = {
  address: TOKEN_SYMBOLS_MAP["USDzC"].addresses[CHAIN_IDs.ZORA],
  chainId: CHAIN_IDs.ZORA,
  symbol: "USDzC",
  decimals: TOKEN_SYMBOLS_MAP["USDzC"].decimals,
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
