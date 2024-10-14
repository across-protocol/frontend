import { CHAIN_IDs, PUBLIC_NETWORKS } from "@across-protocol/constants";
import { utils as sdkUtils } from "@across-protocol/sdk";
import { ChainConfig } from "../types";

const { getDeployedAddress } = sdkUtils;

const chainId = CHAIN_IDs.ARBITRUM_SEPOLIA;
const chainInfoBase = PUBLIC_NETWORKS[chainId];

export default {
  ...chainInfoBase,
  logoPath: "../arbitrum/assets/logo.svg",
  grayscaleLogoPath: "../arbitrum/assets/grayscale-logo.svg",
  spokePool: getDeployedAddress("SpokePool", chainId),
  chainId,
  publicRpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
  tokens: ["WETH", "ETH"],
  enableCCTP: false,
  swapTokens: [],
} as ChainConfig;
