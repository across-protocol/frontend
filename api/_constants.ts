import { ethers } from "ethers";
import {
  relayFeeCalculator,
  utils,
  constants as sdkConstants,
} from "@across-protocol/sdk";
import * as constants from "@across-protocol/constants";
import { getEnvs } from "./_env";

const {
  GRAPH_API_KEY,
  RELAYER_FEE_CAPITAL_COST_ROUTE_OVERRIDES,
  RELAYER_FEE_CAPITAL_COST_DESTINATION_CHAIN_OVERRIDES,
  RELAYER_FEE_CAPITAL_COST_ORIGIN_CHAIN_OVERRIDES,
} = getEnvs();

export const CHAIN_IDs = constants.CHAIN_IDs;
export const TOKEN_SYMBOLS_MAP = constants.TOKEN_SYMBOLS_MAP;
export const CHAINS = constants.PUBLIC_NETWORKS;

export const maxRelayFeePct = 0.25;

export const disabledL1Tokens = [
  TOKEN_SYMBOLS_MAP.BADGER.addresses[CHAIN_IDs.MAINNET],
].map((x) => x.toLowerCase());

const _defaultRelayerFeeCapitalCostConfig: {
  [token: string]: Omit<relayFeeCalculator.CapitalCostConfig, "decimals">;
} = {
  ETH: {
    lowerBound: ethers.utils.parseUnits("0.0001").toString(),
    upperBound: ethers.utils.parseUnits("0.000075").toString(),
    cutoff: ethers.utils.parseUnits("0.3").toString(),
  },
  WETH: {
    lowerBound: ethers.utils.parseUnits("0.0001").toString(),
    upperBound: ethers.utils.parseUnits("0.000075").toString(),
    cutoff: ethers.utils.parseUnits("0.3").toString(),
  },
  WBTC: {
    lowerBound: ethers.utils.parseUnits("0.0003").toString(),
    upperBound: ethers.utils.parseUnits("0.0025").toString(),
    cutoff: ethers.utils.parseUnits("10").toString(),
  },
  DAI: {
    lowerBound: ethers.utils.parseUnits("0.0001").toString(),
    upperBound: ethers.utils.parseUnits("0.0001").toString(),
    cutoff: ethers.utils.parseUnits("1500000").toString(),
  },
  USDC: {
    lowerBound: ethers.utils.parseUnits("0.0001").toString(),
    upperBound: ethers.utils.parseUnits("0.0001").toString(),
    cutoff: ethers.utils.parseUnits("100000").toString(),
  },
  USDT: {
    lowerBound: ethers.utils.parseUnits("0.0001").toString(),
    upperBound: ethers.utils.parseUnits("0.0001").toString(),
    cutoff: ethers.utils.parseUnits("1500000").toString(),
  },
  UMA: {
    lowerBound: ethers.utils.parseUnits("0.0003").toString(),
    upperBound: ethers.utils.parseUnits("0.00075").toString(),
    cutoff: ethers.utils.parseUnits("5000").toString(),
  },
  BADGER: {
    lowerBound: ethers.utils.parseUnits("0.0003").toString(),
    upperBound: ethers.utils.parseUnits("0.001").toString(),
    cutoff: ethers.utils.parseUnits("5000").toString(),
  },
  ACX: {
    lowerBound: ethers.utils.parseUnits("0.0001").toString(),
    upperBound: ethers.utils.parseUnits("0.001").toString(),
    cutoff: ethers.utils.parseUnits("1000000").toString(),
  },
  BAL: {
    lowerBound: ethers.utils.parseUnits("0.0001").toString(),
    upperBound: ethers.utils.parseUnits("0.001").toString(),
    cutoff: ethers.utils.parseUnits("10000").toString(),
  },
  GHO: {
    lowerBound: ethers.utils.parseUnits("0.0001").toString(),
    upperBound: ethers.utils.parseUnits("0.0005").toString(),
    cutoff: ethers.utils.parseUnits("10000").toString(),
  },
  POOL: {
    lowerBound: ethers.utils.parseUnits("0.0001").toString(),
    upperBound: ethers.utils.parseUnits("0.001").toString(),
    cutoff: ethers.utils.parseUnits("10000").toString(),
  },
  BOBA: {
    lowerBound: ethers.utils.parseUnits("0.0003").toString(),
    upperBound: ethers.utils.parseUnits("0.001").toString(),
    cutoff: ethers.utils.parseUnits("100000").toString(),
  },
  SNX: {
    lowerBound: ethers.utils.parseUnits("0.0001").toString(),
    upperBound: ethers.utils.parseUnits("0.0005").toString(),
    cutoff: ethers.utils.parseUnits("10000").toString(),
  },
  LSK: {
    lowerBound: ethers.utils.parseUnits("0.0001").toString(),
    upperBound: ethers.utils.parseUnits("0.0005").toString(),
    cutoff: ethers.utils.parseUnits("10000").toString(),
  },
  GRASS: {
    lowerBound: ethers.utils.parseUnits("0.0001").toString(),
    upperBound: ethers.utils.parseUnits("0.0005").toString(),
    cutoff: ethers.utils.parseUnits("10000").toString(),
  },
  XYZ: {
    lowerBound: ethers.utils.parseUnits("0.0001").toString(),
    upperBound: ethers.utils.parseUnits("0.0005").toString(),
    cutoff: ethers.utils.parseUnits("10000").toString(),
  },
  CAKE: {
    lowerBound: ethers.utils.parseUnits("0.005").toString(),
    upperBound: ethers.utils.parseUnits("0.02").toString(),
    cutoff: ethers.utils.parseUnits("1000").toString(),
  },
  BNB: {
    lowerBound: ethers.utils.parseUnits("0.25").toString(),
    upperBound: ethers.utils.parseUnits("0.5").toString(),
    cutoff: ethers.utils.parseUnits("1").toString(),
  },
  WLD: {
    lowerBound: ethers.utils.parseUnits("0.0001").toString(),
    upperBound: ethers.utils.parseUnits("0.0005").toString(),
    cutoff: ethers.utils.parseUnits("10000").toString(),
  },
};

const defaultRelayerFeeCapitalCostConfig =
  populateDefaultRelayerFeeCapitalCostConfig(
    _defaultRelayerFeeCapitalCostConfig
  );

export function populateDefaultRelayerFeeCapitalCostConfig(
  baseConfig: Record<
    string,
    Omit<relayFeeCalculator.CapitalCostConfig, "decimals">
  >
): {
  [token: string]: relayFeeCalculator.CapitalCostConfig;
} {
  const populatedConfig: {
    [token: string]: relayFeeCalculator.CapitalCostConfig;
  } = {};
  const tokensWithSameConfig = [
    ["USDT", "USDT-BNB"],
    [
      "USDC",
      "USDC.e",
      "USDC-BNB",
      "USDzC",
      "TATARA-USDC",
      "TATARA-USDT",
      "TATARA-USDS",
    ],
    ["WBTC", "TATARA-WBTC"],
    ["DAI", "USDB"],
    ["GHO", "WGHO"],
    ["BNB", "WBNB"],
  ];
  for (const [tokenSymbol, config] of Object.entries(baseConfig)) {
    const token =
      TOKEN_SYMBOLS_MAP[tokenSymbol as keyof typeof TOKEN_SYMBOLS_MAP];
    if (!token) {
      throw new Error(
        `Can't populate capital cost config for ${tokenSymbol}: token not found`
      );
    }
    const decimals = token.decimals;
    populatedConfig[token.symbol] = {
      ...config,
      decimals,
    };
    const equivalentTokens = tokensWithSameConfig.find(([_equivalentTokens]) =>
      _equivalentTokens.includes(token.symbol)
    );
    if (equivalentTokens) {
      for (const equivalentTokenSymbol of equivalentTokens.filter(
        (symbol) => symbol !== token.symbol
      )) {
        const equivalentToken =
          TOKEN_SYMBOLS_MAP[
            equivalentTokenSymbol as keyof typeof TOKEN_SYMBOLS_MAP
          ];
        if (!equivalentToken) {
          throw new Error(
            `Can't populate capital cost config for ${tokenSymbol}: equivalent token ${equivalentTokenSymbol} not found`
          );
        }
        const equivalentTokenDecimals = equivalentToken.decimals;
        populatedConfig[equivalentToken.symbol] = {
          ...config,
          decimals: equivalentTokenDecimals,
        };
      }
    }
  }
  return populatedConfig;
}

export const coinGeckoAssetPlatformLookup: Record<string, number> = {
  "0x4200000000000000000000000000000000000042": CHAIN_IDs.OPTIMISM,
};

export const graphAPIKey = GRAPH_API_KEY;

// {
//   "TOKEN_SYMBOL": {
//     "ORIGIN_CHAIN_ID": {
//       "DESTINATION_CHAIN_ID": {
//         "lowerBound": "1000000000000000",
//         "upperBound": "5000000000000000",
//         "cutoff": "10000000000000000000000",
//         "decimals": 18
//       }
//     }
//   }
// }
const relayerFeeCapitalCostRouteOverrides: Record<
  string,
  Record<string, Record<string, relayFeeCalculator.CapitalCostConfig>>
> = RELAYER_FEE_CAPITAL_COST_ROUTE_OVERRIDES
  ? JSON.parse(RELAYER_FEE_CAPITAL_COST_ROUTE_OVERRIDES)
  : {};

// {
//   "TOKEN_SYMBOL": {
//     "DESTINATION_CHAIN_ID": {
//       "lowerBound": "1000000000000000",
//       "upperBound": "5000000000000000",
//       "cutoff": "10000000000000000000000",
//       "decimals": 18
//     }
//   }
// }
const relayerFeeCapitalCostDestinationChainOverrides: Record<
  string,
  Record<string, relayFeeCalculator.CapitalCostConfig>
> = RELAYER_FEE_CAPITAL_COST_DESTINATION_CHAIN_OVERRIDES
  ? JSON.parse(RELAYER_FEE_CAPITAL_COST_DESTINATION_CHAIN_OVERRIDES)
  : {};

const relayerFeeCapitalCostOriginChainOverrides: Record<
  string,
  Record<string, relayFeeCalculator.CapitalCostConfig>
> = RELAYER_FEE_CAPITAL_COST_ORIGIN_CHAIN_OVERRIDES
  ? JSON.parse(RELAYER_FEE_CAPITAL_COST_ORIGIN_CHAIN_OVERRIDES)
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
          routeOverrides: relayerFeeCapitalCostRouteOverrides[token] || {},
          destinationChainOverrides:
            relayerFeeCapitalCostDestinationChainOverrides[token] || {},
          originChainOverrides:
            relayerFeeCapitalCostOriginChainOverrides[token] || {},
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
export const SUPPORTED_CG_DERIVED_CURRENCIES = new Set([
  "azero",
  "matic",
  "gho",
  "bnb",
]);
export const CG_CONTRACTS_DEFERRED_TO_ID = new Set([
  TOKEN_SYMBOLS_MAP.AZERO.addresses[CHAIN_IDs.MAINNET],
  TOKEN_SYMBOLS_MAP.WGHO.addresses[CHAIN_IDs.MAINNET],
  TOKEN_SYMBOLS_MAP.GHO.addresses[CHAIN_IDs.MAINNET],
  ...Object.values(TOKEN_SYMBOLS_MAP["TATARA-USDC"].addresses),
  TOKEN_SYMBOLS_MAP.BNB.addresses[CHAIN_IDs.MAINNET],
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
  TOKEN_SYMBOLS_MAP.WGHO,
  TOKEN_SYMBOLS_MAP.LSK,
  TOKEN_SYMBOLS_MAP.BNB,
  TOKEN_SYMBOLS_MAP.CAKE,
  TOKEN_SYMBOLS_MAP.WLD,
];

export const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;

export const MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";
export const MULTICALL3_ADDRESS_OVERRIDES = {
  [CHAIN_IDs.ALEPH_ZERO]: "0x3CA11702f7c0F28e0b4e03C31F7492969862C569",
  [CHAIN_IDs.LENS]: "0xeee5a340Cdc9c179Db25dea45AcfD5FE8d4d3eB8",
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

export const CUSTOM_GAS_TOKENS = {
  ...sdkConstants.CUSTOM_GAS_TOKENS,
  [CHAIN_IDs.LENS]: "GHO",
  [CHAIN_IDs.BSC]: "BNB",
};
