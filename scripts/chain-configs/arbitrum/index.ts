import { CHAIN_IDs, PUBLIC_NETWORKS } from "@across-protocol/constants";
import { utils as sdkUtils } from "@across-protocol/sdk";
const { getDeployedAddress, getDeployedBlockNumber } = sdkUtils;

import { ChainConfig } from "../types";

const chainId = CHAIN_IDs.ARBITRUM;
const chainInfoBase = PUBLIC_NETWORKS[chainId];

export default {
  ...chainInfoBase,
  name: "Arbitrum",
  fullName: "Arbitrum One",
  logoPath: "./assets/logo.svg",
  grayscaleLogoPath: "./assets/grayscale-logo.svg",
  spokePool: {
    address: getDeployedAddress("SpokePool", chainId),
    blockNumber: getDeployedBlockNumber("SpokePool", chainId),
  },
  publicRpcUrl: "https://arb1.arbitrum.io/rpc",
  chainId,
  tokens: [
    "WBTC",
    "USDC",
    "WETH",
    "ETH",
    "UMA",
    "DAI",
    "BAL",
    "ACX",
    "POOL",
    "ezETH",
  ],
  enableCCTP: true,
  blockTimeSeconds: 1,
} as ChainConfig;
