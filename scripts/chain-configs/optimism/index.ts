import { CHAIN_IDs, PUBLIC_NETWORKS } from "@across-protocol/constants";
import { utils as sdkUtils } from "@across-protocol/sdk";
const { getDeployedAddress, getDeployedBlockNumber } = sdkUtils;

import { ChainConfig } from "../types";

const chainId = CHAIN_IDs.OPTIMISM;
const chainInfoBase = PUBLIC_NETWORKS[chainId];

export default {
  ...chainInfoBase,
  logoPath: "./assets/logo.svg",
  grayscaleLogoPath: "./assets/grayscale-logo.svg",
  spokePool: {
    address: getDeployedAddress("SpokePool", chainId),
    blockNumber: getDeployedBlockNumber("SpokePool", chainId),
  },
  publicRpcUrl: "https://mainnet.optimism.io",
  chainId,
  tokens: [
    "WETH",
    "ETH",
    "USDC",
    "WBTC",
    "UMA",
    "DAI",
    "BAL",
    "ACX",
    "USDT",
    "SNX",
    "POOL",
    "WLD",
    "ezETH",
  ],
  blockTimeSeconds: 2,
  enableCCTP: true,
} as ChainConfig;
