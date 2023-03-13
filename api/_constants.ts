import { ethers } from "ethers";
import { constants, relayFeeCalculator } from "@across-protocol/sdk-v2";

export const maxRelayFeePct = 0.25;

export const disabledL1Tokens = [
  constants.TOKEN_SYMBOLS_MAP.BADGER.addresses[constants.CHAIN_IDs.MAINNET],
].map((x) => x.toLowerCase());

const defaultRelayerFeeCapitalCostConfig: {
  [token: string]: relayFeeCalculator.CapitalCostConfig;
} = {
  ETH: {
    lowerBound: ethers.utils.parseUnits("0.0001").toString(),
    upperBound: ethers.utils.parseUnits("0.0001").toString(),
    cutoff: ethers.utils.parseUnits("750").toString(),
    decimals: 18,
  },
  WETH: {
    lowerBound: ethers.utils.parseUnits("0.0001").toString(),
    upperBound: ethers.utils.parseUnits("0.0001").toString(),
    cutoff: ethers.utils.parseUnits("750").toString(),
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
    cutoff: ethers.utils.parseUnits("250000").toString(),
    decimals: 18,
  },
  USDC: {
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
  BOBA: {
    lowerBound: ethers.utils.parseUnits("0.0003").toString(),
    upperBound: ethers.utils.parseUnits("0.001").toString(),
    cutoff: ethers.utils.parseUnits("100000").toString(),
    decimals: 18,
  },
};

const relayerFeeCapitalCostOverrides: Record<
  string,
  Record<string, Record<string, relayFeeCalculator.CapitalCostConfig>>
> = process.env.RELAYER_FEE_CAPITAL_COST_OVERRIDES
  ? JSON.parse(process.env.RELAYER_FEE_CAPITAL_COST_OVERRIDES)
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

/**
 * The cushion applied to the total available liquidity when calculating the max amount of a token to relay.
 * This is to account for slippage and other factors that may cause the relay to fail.
 * This map takes the following format:
 * {
 *    "DAI": "100000",
 *    "DAI:1:10": "100001",
 * }
 * The key is the token symbol, and the value is the cushion in wei. If the key is a token symbol followed by a colon,
 * followed by an origin chain ID, followed by a colon, followed by a destination chain ID, then the cushion will only
 * apply to that specific route. For example, the key "DAI:1:10" will only apply to the DAI route from mainnet to
 * optimism.
 */
export const lpCushionMap: {
  [symbol: string]: string;
} = process.env.REACT_APP_LP_CUSHION_MAP
  ? JSON.parse(process.env.REACT_APP_LP_CUSHION_MAP)
  : {};

// If `timestamp` is not passed into a suggested-fees query, then return the latest mainnet timestamp minus this buffer.
export const DEFAULT_QUOTE_TIMESTAMP_BUFFER = 12 * 25; // ~25 blocks on mainnet (12s/block), ~= 5 minutes.

export const BLOCK_TAG_LAG = -1;

// Note: this is a small subset of all the supported base currencies, but since we don't expect to use the others,
// we've decided to keep this list small for now.
export const SUPPORTED_CG_BASE_CURRENCIES = new Set(["eth", "usd"]);
