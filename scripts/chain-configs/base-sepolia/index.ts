import { CHAIN_IDs, PUBLIC_NETWORKS } from "@across-protocol/constants";
import { utils as sdkUtils } from "@across-protocol/sdk";
import { ChainConfig } from "../types";

const { getDeployedAddress, getDeployedBlockNumber } = sdkUtils;

const chainId = CHAIN_IDs.BASE_SEPOLIA;
const chainInfoBase = PUBLIC_NETWORKS[chainId];

export default {
  ...chainInfoBase,
  logoPath: "../base/assets/logo.svg",
  grayscaleLogoPath: "../base/assets/grayscale-logo.svg",
  spokePool: {
    address: getDeployedAddress("SpokePool", chainId),
    blockNumber: getDeployedBlockNumber("SpokePool", chainId),
  },
  chainId,
  publicRpcUrl: "https://sepolia.base.org",
  tokens: ["WETH", "ETH", "USDC", "XYZ"],
  enableCCTP: true,
  swapTokens: [
    {
      swapInputTokenSymbol: "USDbC",
      acrossInputTokenSymbol: "USDC",
      acrossOutputTokenSymbol: "USDC",
    },
    {
      swapInputTokenSymbol: "USDbC",
      acrossInputTokenSymbol: "USDC",
      acrossOutputTokenSymbol: "USDC.e",
    },
  ],
} as ChainConfig;
