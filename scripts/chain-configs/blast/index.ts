import { CHAIN_IDs, PUBLIC_NETWORKS } from "@across-protocol/constants";
import { utils as sdkUtils } from "@across-protocol/sdk";
const { getDeployedAddress, getDeployedBlockNumber } = sdkUtils;

import { ChainConfig } from "../types";

const chainId = CHAIN_IDs.BLAST;
const chainInfoBase = PUBLIC_NETWORKS[chainId];

export default {
  ...chainInfoBase,
  logoPath: "./assets/logo.svg",
  grayscaleLogoPath: "./assets/grayscale-logo.svg",
  spokePool: {
    address: getDeployedAddress("SpokePool", chainId),
    blockNumber: getDeployedBlockNumber("SpokePool", chainId),
  },
  chainId,
  publicRpcUrl: "https://rpc.blast.io",
  blockTimeSeconds: 2,
  tokens: ["WETH", "ETH", "USDB", "WBTC"],
  // Only allow USDB and WBTC as input tokens (from this chain)
  inputTokens: ["USDB", "WBTC"],
  enableCCTP: false,
  swapTokens: [],
} as ChainConfig;
