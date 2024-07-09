import { CHAIN_IDs, PUBLIC_NETWORKS } from "@across-protocol/constants";
import { utils as sdkUtils } from "@across-protocol/sdk";
import { ChainConfig } from "../types";

const { getDeployedAddress } = sdkUtils;

const chainId = CHAIN_IDs.MODE_SEPOLIA;
const chainInfoBase = PUBLIC_NETWORKS[chainId];

export default {
  ...chainInfoBase,
  logoPath: "../mode/assets/logo.svg",
  grayscaleLogoPath: "../mode/assets/grayscale-logo.svg",
  spokePool: getDeployedAddress("SpokePool", chainId),
  chainId,
  publicRpcUrl: "https://sepolia.mode.network",
  tokens: ["WETH", "ETH"],
  enableCCTP: false,
  swapTokens: [],
} as ChainConfig;
