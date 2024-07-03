import { CHAIN_IDs, PUBLIC_NETWORKS } from "@across-protocol/constants";
import { utils as sdkUtils } from "@across-protocol/sdk";
const { getDeployedAddress } = sdkUtils;

import { ChainConfig } from "../types";

const chainId = CHAIN_IDs.BASE;
const chainInfoBase = PUBLIC_NETWORKS[chainId];

export default {
  ...chainInfoBase,
  logoPath: "./assets/logo.svg",
  grayscaleLogoPath: "./assets/grayscale-logo.svg",
  spokePool: getDeployedAddress("SpokePool", chainId),
  chainId,
  publicRpcUrl: "https://mainnet.base.org",
  tokens: ["USDC", "WETH", "ETH", "DAI", "BAL", "POOL"],
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
