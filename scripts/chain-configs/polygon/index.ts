import { CHAIN_IDs, PUBLIC_NETWORKS } from "@across-protocol/constants";
import { utils as sdkUtils } from "@across-protocol/sdk";
const { getDeployedAddress } = sdkUtils;

import { ChainConfig } from "../types";

const chainId = CHAIN_IDs.POLYGON;
const chainInfoBase = PUBLIC_NETWORKS[chainId];

export default {
  ...chainInfoBase,
  fullName: "Polygon Network",
  logoPath: "./assets/logo.svg",
  grayscaleLogoPath: "./assets/grayscale-logo.svg",
  spokePool: getDeployedAddress("SpokePool", chainId),
  chainId,
  publicRpcUrl: "https://rpc.ankr.com/polygon",
  tokens: ["DAI", "UMA", "WETH", "USDC", "WBTC", "BAL", "ACX", "USDT", "POOL"],
  enableCCTP: true,
  blockTimeSeconds: 5,
} as ChainConfig;
