import { CHAIN_IDs, PUBLIC_NETWORKS } from "@across-protocol/constants";
import { utils as sdkUtils } from "@across-protocol/sdk";
const { getDeployedAddress } = sdkUtils;

import { ChainConfig } from "../types";

const chainId = CHAIN_IDs.ZK_SYNC;
const chainInfoBase = PUBLIC_NETWORKS[chainId];

export default {
  ...chainInfoBase,
  fullName: "zkSync Era",
  logoPath: "./assets/logo.svg",
  grayscaleLogoPath: "./assets/grayscale-logo.svg",
  spokePool: getDeployedAddress("SpokePool", chainId),
  chainId,
  blockTimeSeconds: 2,
  publicRpcUrl: "https://mainnet.era.zksync.io",
  tokens: ["WETH", "ETH", "USDC.e", "WBTC", "USDT", "DAI"],
  enableCCTP: false,
  swapTokens: [],
} as ChainConfig;
