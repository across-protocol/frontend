import { ethers } from "ethers";
import { relayFeeCalculator, utils } from "@across-protocol/sdk";
import * as constants from "@across-protocol/constants";
import { getEnvs } from "./_env";

const { GRAPH_API_KEY, RELAYER_FEE_CAPITAL_COST_OVERRIDES } = getEnvs();

export const CHAIN_IDs = constants.CHAIN_IDs;
export const TOKEN_SYMBOLS_MAP = constants.TOKEN_SYMBOLS_MAP;

export const maxRelayFeePct = 0.25;

export const disabledL1Tokens = [
  TOKEN_SYMBOLS_MAP.BADGER.addresses[CHAIN_IDs.MAINNET],
].map((x) => x.toLowerCase());

const defaultRelayerFeeCapitalCostConfig: {
  [token: string]: relayFeeCalculator.CapitalCostConfig;
} = {
  ETH: {
    lowerBound: ethers.utils.parseUnits("0.0001").toString(),
    upperBound: ethers.utils.parseUnits("0.000075").toString(),
    cutoff: ethers.utils.parseUnits("0.3").toString(),
    decimals: 18,
  },
  WETH: {
    lowerBound: ethers.utils.parseUnits("0.0001").toString(),
    upperBound: ethers.utils.parseUnits("0.000075").toString(),
    cutoff: ethers.utils.parseUnits("0.3").toString(),
    decimals: 18,
  },
  WBTC: {
    lowerBound: ethers.utils.parseUnits("0.0003").toString(),
    upperBound: ethers.utils.parseUnits("0.0025").toString(),
    cutoff: ethers.utils.parseUnits("10").toString(),
    decimals: 8,
  },
  DAI: {
    lowerBound: ethers.utils.parseUnits("0.0001").toString(),
    upperBound: ethers.utils.parseUnits("0.0001").toString(),
    cutoff: ethers.utils.parseUnits("1500000").toString(),
    decimals: 18,
  },
  USDC: {
    lowerBound: ethers.utils.parseUnits("0.0001").toString(),
    upperBound: ethers.utils.parseUnits("0").toString(),
    cutoff: ethers.utils.parseUnits("100000").toString(),
    decimals: 6,
  },
  USDT: {
    lowerBound: ethers.utils.parseUnits("0.0001").toString(),
    upperBound: ethers.utils.parseUnits("0.0001").toString(),
    cutoff: ethers.utils.parseUnits("1500000").toString(),
    decimals: 6,
  },
  UMA: {
    lowerBound: ethers.utils.parseUnits("0.0003").toString(),
    upperBound: ethers.utils.parseUnits("0.00075").toString(),
    cutoff: ethers.utils.parseUnits("5000").toString(),
    decimals: 18,
  },
  BADGER: {
    lowerBound: ethers.utils.parseUnits("0.0003").toString(),
    upperBound: ethers.utils.parseUnits("0.001").toString(),
    cutoff: ethers.utils.parseUnits("5000").toString(),
    decimals: 18,
  },
  ACX: {
    lowerBound: ethers.utils.parseUnits("0.0001").toString(),
    upperBound: ethers.utils.parseUnits("0.001").toString(),
    cutoff: ethers.utils.parseUnits("1000000").toString(),
    decimals: 18,
  },
  BAL: {
    lowerBound: ethers.utils.parseUnits("0.0001").toString(),
    upperBound: ethers.utils.parseUnits("0.001").toString(),
    cutoff: ethers.utils.parseUnits("10000").toString(),
    decimals: 18,
  },
  POOL: {
    lowerBound: ethers.utils.parseUnits("0.0001").toString(),
    upperBound: ethers.utils.parseUnits("0.001").toString(),
    cutoff: ethers.utils.parseUnits("10000").toString(),
    decimals: 18,
  },
  BOBA: {
    lowerBound: ethers.utils.parseUnits("0.0003").toString(),
    upperBound: ethers.utils.parseUnits("0.001").toString(),
    cutoff: ethers.utils.parseUnits("100000").toString(),
    decimals: 18,
  },
  SNX: {
    lowerBound: ethers.utils.parseUnits("0.0001").toString(),
    upperBound: ethers.utils.parseUnits("0.0005").toString(),
    cutoff: ethers.utils.parseUnits("10000").toString(),
    decimals: 18,
  },
  LSK: {
    lowerBound: ethers.utils.parseUnits("0.0001").toString(),
    upperBound: ethers.utils.parseUnits("0.0005").toString(),
    cutoff: ethers.utils.parseUnits("10000").toString(),
    decimals: 18,
  },
  GRASS: {
    lowerBound: ethers.utils.parseUnits("0.0001").toString(),
    upperBound: ethers.utils.parseUnits("0.0005").toString(),
    cutoff: ethers.utils.parseUnits("10000").toString(),
    decimals: 18,
  },
  XYZ: {
    lowerBound: ethers.utils.parseUnits("0.0001").toString(),
    upperBound: ethers.utils.parseUnits("0.0005").toString(),
    cutoff: ethers.utils.parseUnits("10000").toString(),
    decimals: 18,
  },
};

defaultRelayerFeeCapitalCostConfig["USDC.e"] = {
  ...defaultRelayerFeeCapitalCostConfig["USDC"],
};
defaultRelayerFeeCapitalCostConfig["USDzC"] = {
  ...defaultRelayerFeeCapitalCostConfig["USDC"],
};
defaultRelayerFeeCapitalCostConfig["USDB"] = {
  ...defaultRelayerFeeCapitalCostConfig["DAI"],
};
defaultRelayerFeeCapitalCostConfig["TATARA-USDC"] = {
  ...defaultRelayerFeeCapitalCostConfig["USDC"],
};
defaultRelayerFeeCapitalCostConfig["TATARA-USDT"] = {
  ...defaultRelayerFeeCapitalCostConfig["USDC"],
};
defaultRelayerFeeCapitalCostConfig["TATARA-USDS"] = {
  ...defaultRelayerFeeCapitalCostConfig["USDC"],
};
defaultRelayerFeeCapitalCostConfig["TATARA-WBTC"] = {
  ...defaultRelayerFeeCapitalCostConfig["WBTC"],
};

export const coinGeckoAssetPlatformLookup: Record<string, number> = {
  "0x4200000000000000000000000000000000000042": CHAIN_IDs.OPTIMISM,
};

export const graphAPIKey = GRAPH_API_KEY;

const relayerFeeCapitalCostOverrides: Record<
  string,
  Record<string, Record<string, relayFeeCalculator.CapitalCostConfig>>
> = RELAYER_FEE_CAPITAL_COST_OVERRIDES
  ? JSON.parse(RELAYER_FEE_CAPITAL_COST_OVERRIDES)
  : {};

export const relayerFeeCapitalCostConfig: {
  [token: string]: relayFeeCalculator.RelayCapitalCostConfig;
} = Object.fromEntries(
  Object.keys(defaultRelayerFeeCapitalCostConfig).map(
    (token): [string, relayFeeCalculator.CapitalCostConfigOverride] => {
      return [
        token,
        {
          default: defaultRelayerFeeCapitalCostConfig[token],
          routeOverrides: relayerFeeCapitalCostOverrides[token] || {},
        },
      ];
    }
  )
);

// If `timestamp` is not passed into a suggested-fees query, then return the latest mainnet block minus this buffer
// rounded down to the nearest `QUOTE_BLOCK_PRECISION`th block interval. Can be overridden by env var `QUOTE_BLOCK_BUFFER`.
export const DEFAULT_QUOTE_BLOCK_BUFFER = 25; // ~25 blocks on mainnet (12s/block), ~= 5 minutes.

export const BLOCK_TAG_LAG = -1;

// Note: this is a small subset of all the supported base currencies, but since we don't expect to use the others,
// we've decided to keep this list small for now.
export const SUPPORTED_CG_BASE_CURRENCIES = new Set(["eth", "usd"]);
// Note: this is a small set of currencies that the API will derive from the base currencies by using USD as an intermediary.
export const SUPPORTED_CG_DERIVED_CURRENCIES = new Set(["azero", "matic"]);
export const CG_CONTRACTS_DEFERRED_TO_ID = new Set([
  TOKEN_SYMBOLS_MAP.AZERO.addresses[CHAIN_IDs.MAINNET],
  ...Object.values(TOKEN_SYMBOLS_MAP["TATARA-USDC"].addresses),
]);

// 1:1 because we don't need to handle underlying tokens on FE
export const EXTERNAL_POOL_TOKEN_EXCHANGE_RATE = utils.fixedPointAdjustment;

export const ENABLED_POOLS_UNDERLYING_TOKENS = [
  TOKEN_SYMBOLS_MAP.ETH,
  TOKEN_SYMBOLS_MAP.WETH,
  TOKEN_SYMBOLS_MAP.USDC,
  TOKEN_SYMBOLS_MAP.USDT,
  TOKEN_SYMBOLS_MAP.DAI,
  TOKEN_SYMBOLS_MAP.WBTC,
  TOKEN_SYMBOLS_MAP.BAL,
  TOKEN_SYMBOLS_MAP.UMA,
  TOKEN_SYMBOLS_MAP.ACX,
  TOKEN_SYMBOLS_MAP.SNX,
  TOKEN_SYMBOLS_MAP.POOL,
];

export const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;

export const MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";
export const MULTICALL3_ADDRESS_OVERRIDES = {
  [CHAIN_IDs.ALEPH_ZERO]: "0x3CA11702f7c0F28e0b4e03C31F7492969862C569",
  [CHAIN_IDs.ZK_SYNC]: "0xF9cda624FBC7e059355ce98a31693d299FACd963",
};

export const DEFI_LLAMA_POOL_LOOKUP: Record<string, string> = {
  "0x36Be1E97eA98AB43b4dEBf92742517266F5731a3":
    "8f7b5b8c-09db-45e3-8938-f30115d34672",
};

export const DEFAULT_SIMULATED_RECIPIENT_ADDRESS =
  "0xBb23Cd0210F878Ea4CcA50e9dC307fb0Ed65Cf6B";

export const DOMAIN_CALLDATA_DELIMITER = "0x1dc0de";

export const DEFAULT_LITE_CHAIN_USD_MAX_BALANCE = "250000";

export const DEFAULT_LITE_CHAIN_USD_MAX_DEPOSIT = "25000";

export const DEFAULT_FILL_DEADLINE_BUFFER_SECONDS = 3.25 * 60 * 60; // 3.25 hours
