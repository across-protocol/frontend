import { CHAIN_IDs, PUBLIC_NETWORKS } from "@across-protocol/constants";
import { utils as sdkUtils } from "@across-protocol/sdk";
const { getDeployedAddress } = sdkUtils;

import { ChainConfig } from "../types";

const chainId = CHAIN_IDs.OPTIMISM;
const chainInfoBase = PUBLIC_NETWORKS[chainId];

export default {
  ...chainInfoBase,
  logoPath: "./assets/logo.svg",
  grayscaleLogoPath: "./assets/grayscale-logo.svg",
  spokePool: getDeployedAddress("SpokePool", chainId),
  publicRpcUrl: "https://mainnet.optimism.io",
  chainId,
  tokens: [
    "WETH",
    "ETH",
    "USDC",
    "WBTC",
    "UMA",
    "DAI",
    "BAL",
    "ACX",
    "USDT",
    "SNX",
    "POOL",
  ],
  blockTimeSeconds: 2,
  enableCCTP: true,
  swapTokens: [
    {
      swapInputTokenSymbol: "USDC.e",
      acrossInputTokenSymbol: "USDC",
      acrossOutputTokenSymbol: "USDC",
    },
    {
      swapInputTokenSymbol: "USDC.e",
      acrossInputTokenSymbol: "USDC",
      acrossOutputTokenSymbol: "USDC.e",
    },
    {
      swapInputTokenSymbol: "USDC.e",
      acrossInputTokenSymbol: "USDC",
      acrossOutputTokenSymbol: "USDbC",
    },
  ],
} as ChainConfig;
