import { CHAIN_IDs, PUBLIC_NETWORKS } from "@across-protocol/constants";
import { utils as sdkUtils } from "@across-protocol/sdk";
import { ChainConfig } from "../types";

const { getDeployedAddress } = sdkUtils;

const chainId = CHAIN_IDs.OPTIMISM_SEPOLIA;
const chainInfoBase = PUBLIC_NETWORKS[chainId];

export default {
  ...chainInfoBase,
  logoPath: "../optimism/assets/logo.svg",
  grayscaleLogoPath: "../optimism/assets/grayscale-logo.svg",
  spokePool: getDeployedAddress("SpokePool", chainId),
  chainId,
  publicRpcUrl: "https://sepolia.optimism.io",
  tokens: [],
  enableCCTP: false,
  swapTokens: [],
} as ChainConfig;
