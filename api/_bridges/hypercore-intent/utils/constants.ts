import { getDeployedAddress } from "@across-protocol/contracts";

import { TOKEN_SYMBOLS_MAP, CHAIN_IDs } from "../../../_constants";

export const USDH_FILL_DESTINATION_GAS_LIMIT_USD = 0.25; // 0.25 USD

export function getHyperliquidDepositHandlerAddress(
  chainId: number = CHAIN_IDs.HYPEREVM
): string {
  const address = getDeployedAddress("HyperliquidDepositHandler", chainId);
  if (!address) {
    throw new Error(`HyperliquidDepositHandler not found on chain ${chainId}`);
  }
  return address;
}

export const SUPPORTED_INPUT_TOKENS = [
  TOKEN_SYMBOLS_MAP.USDC,
  TOKEN_SYMBOLS_MAP.USDT,
];

export const SUPPORTED_OUTPUT_TOKENS = [
  TOKEN_SYMBOLS_MAP.USDH,
  TOKEN_SYMBOLS_MAP["USDH-SPOT"],
  TOKEN_SYMBOLS_MAP["USDT-SPOT"],
];

export const SUPPORTED_ORIGIN_CHAINS = Object.values(CHAIN_IDs).flatMap(
  (chainId) => {
    const isSupportedInputToken = SUPPORTED_INPUT_TOKENS.some(
      (token) => token.addresses[Number(chainId)]
    );
    return isSupportedInputToken ? [Number(chainId)] : [];
  }
);

export const SUPPORTED_DESTINATION_CHAINS = [
  CHAIN_IDs.HYPEREVM,
  CHAIN_IDs.HYPERCORE,
  CHAIN_IDs.HYPEREVM_TESTNET,
  CHAIN_IDs.HYPERCORE_TESTNET,
];

export const BRIDGEABLE_OUTPUT_TOKEN_PER_OUTPUT_TOKEN: Record<
  (typeof SUPPORTED_OUTPUT_TOKENS)[number]["symbol"],
  (typeof TOKEN_SYMBOLS_MAP)[keyof typeof TOKEN_SYMBOLS_MAP]
> = {
  USDH: TOKEN_SYMBOLS_MAP.USDH,
  "USDH-SPOT": TOKEN_SYMBOLS_MAP.USDH,
  "USDT-SPOT": TOKEN_SYMBOLS_MAP.USDT,
};

export const OUTPUT_TO_BRIDGEABLE_TOKEN_SYMBOL: Record<string, string> = {
  USDH: "USDC",
  "USDH-SPOT": "USDC",
  "USDC-SPOT": "USDC",
  "USDT-SPOT": "USDT",
};

export const ERROR_MESSAGE_PREFIX = "Sponsored Intent";
