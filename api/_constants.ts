import { ethers } from "ethers";
import { constants, relayFeeCalculator, utils } from "@across-protocol/sdk-v2";

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
  USDT: {
    lowerBound: ethers.utils.parseUnits("0.0001").toString(),
    upperBound: ethers.utils.parseUnits("0.0001").toString(),
    cutoff: ethers.utils.parseUnits("250000").toString(),
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

// If `timestamp` is not passed into a suggested-fees query, then return the latest mainnet timestamp minus this buffer.
export const DEFAULT_QUOTE_TIMESTAMP_BUFFER = 12 * 25; // ~25 blocks on mainnet (12s/block), ~= 5 minutes.

// If `timestamp` is not passed into a suggested-fees query, then return the latest price rounded to
// the nearest multiple of this value.
export const DEFAULT_QUOTE_TIMESTAMP_PRECISION = 5 * 60; // 5 minutes

export const BLOCK_TAG_LAG = -1;

// Note: this is a small subset of all the supported base currencies, but since we don't expect to use the others,
// we've decided to keep this list small for now.
export const SUPPORTED_CG_BASE_CURRENCIES = new Set(["eth", "usd"]);

export const SPOKE_POOLS = {
  [constants.CHAIN_IDs.MAINNET]: {
    address: "0x5c7BCd6E7De5423a257D81B442095A1a6ced35C5",
    deploymentBlock: 17117454,
  },
  [constants.CHAIN_IDs.OPTIMISM]: {
    address: "0x6f26Bf09B1C792e3228e5467807a900A503c0281",
    deploymentBlock: 93903076,
  },
  [constants.CHAIN_IDs.POLYGON]: {
    address: "0x9295ee1d8C5b022Be115A2AD3c30C72E34e7F096",
    deploymentBlock: 41908657,
  },
  [constants.CHAIN_IDs.ARBITRUM]: {
    address: "0xe35e9842fceaCA96570B734083f4a58e8F7C5f2A",
    deploymentBlock: 83868041,
  },
  [constants.CHAIN_IDs.BOBA]: {
    address: "0xBbc6009fEfFc27ce705322832Cb2068F8C1e0A58",
    deploymentBlock: 619993,
  },
  // testnets
  [constants.CHAIN_IDs.GOERLI]: {
    address: "0x063fFa6C9748e3f0b9bA8ee3bbbCEe98d92651f7",
    deploymentBlock: 8824778,
  },
  [constants.CHAIN_IDs.ARBITRUM_GOERLI]: {
    address: "0xD29C85F15DF544bA632C9E25829fd29d767d7978",
    deploymentBlock: 16711734,
  },
};

export const CONFIG_STORE_VERSION = Number(
  process.env.CONFIG_STORE_VERSION || utils.UBA_MIN_CONFIG_STORE_VERSION
);
