import { CHAIN_IDs, PUBLIC_NETWORKS } from "@across-protocol/constants";
import { utils as sdkUtils } from "@across-protocol/sdk";
const { getDeployedAddress } = sdkUtils;

import { ChainConfig } from "../types";

const chainId = CHAIN_IDs.ARBITRUM;
const chainInfoBase = PUBLIC_NETWORKS[chainId];

export default {
  ...chainInfoBase,
  name: "Arbitrum",
  fullName: "Arbitrum One",
  logoPath: "./assets/logo.svg",
  grayscaleLogoPath: "./assets/grayscale-logo.svg",
  spokePool: getDeployedAddress("SpokePool", chainId),
  publicRpcUrl: "https://arb1.arbitrum.io/rpc",
  chainId,
  tokens: [
    "WBTC",
    "USDC",
    "WETH",
    "ETH",
    "UMA",
    "DAI",
    "BAL",
    "ACX",
    "USDT",
    "POOL",
  ],
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
