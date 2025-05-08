import { CHAIN_IDs, PUBLIC_NETWORKS } from "@across-protocol/constants";
import { utils as sdkUtils } from "@across-protocol/sdk";
const { getDeployedAddress, getDeployedBlockNumber } = sdkUtils;

import { ChainConfig } from "../types";

const chainId = CHAIN_IDs.BASE;
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
  publicRpcUrl: "https://mainnet.base.org",
  tokens: ["USDC", "WETH", "ETH", "DAI", "BAL", "POOL", "VLR"],
  enableCCTP: true,
  blockTimeSeconds: 2,
} as ChainConfig;
