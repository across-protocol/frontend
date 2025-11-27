import { TOKEN_SYMBOLS_MAP } from "../../../_constants";
import { CHAIN_IDs } from "../../../_constants";

export const USDH_FILL_DESTINATION_GAS_LIMIT_USD = 0.25; // 0.25 USD

// TODO: Pull from @across-protocol/contracts once `HyperliquidDepositHandler`
// deployments are available upstream.
export const HYPERLIQUID_DEPOSIT_HANDLER_ADDRESS =
  "0x861E127036B28D32f3777B4676F6bbb9e007d195";

export const SUPPORTED_INPUT_TOKENS = [
  TOKEN_SYMBOLS_MAP.USDC,
  TOKEN_SYMBOLS_MAP["USDC-BNB"],
];
export const SUPPORTED_OUTPUT_TOKENS = [
  TOKEN_SYMBOLS_MAP.USDH,
  TOKEN_SYMBOLS_MAP["USDH-SPOT"],
];
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
};

export const ERROR_MESSAGE_PREFIX = "Sponsored Intent";
