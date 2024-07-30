import { CHAIN_IDs, PUBLIC_NETWORKS } from "@across-protocol/constants";
import { utils as sdkUtils } from "@across-protocol/sdk";
const { getDeployedAddress } = sdkUtils;

import { ChainConfig } from "../types";

const chainId = CHAIN_IDs.MAINNET;
const chainInfoBase = PUBLIC_NETWORKS[chainId];

export default {
  ...chainInfoBase,
  name: "Ethereum",
  fullName: "Ethereum Mainnet",
  logoPath: "./assets/logo.svg",
  grayscaleLogoPath: "./assets/grayscale-logo.svg",
  spokePool: getDeployedAddress("SpokePool", chainId),
  chainId,
  blockTimeSeconds: 12,
  publicRpcUrl: "https://mainnet.gateway.tenderly.co",
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
    "LSK",
  ],
  enableCCTP: false,
  swapTokens: [],
} as ChainConfig;
