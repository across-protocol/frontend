import { CHAIN_IDs, PUBLIC_NETWORKS } from "@across-protocol/constants";
import { utils as sdkUtils } from "@across-protocol/sdk";
import { ChainConfig } from "../types";

const { getDeployedAddress, getDeployedBlockNumber } = sdkUtils;

const chainId = CHAIN_IDs.OPTIMISM_SEPOLIA;
const chainInfoBase = PUBLIC_NETWORKS[chainId];

export default {
  ...chainInfoBase,
  logoPath: "../optimism/assets/logo.svg",
  grayscaleLogoPath: "../optimism/assets/grayscale-logo.svg",
  spokePool: {
    address: getDeployedAddress("SpokePool", chainId),
    blockNumber: getDeployedBlockNumber("SpokePool", chainId),
  },
  chainId,
  publicRpcUrl: "https://sepolia.optimism.io",
  tokens: ["ETH", "WETH", "USDC"],
  enableCCTP: false,
  swapTokens: [],
} as ChainConfig;
