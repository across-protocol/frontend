import { CHAIN_IDs, PUBLIC_NETWORKS } from "@across-protocol/constants";
import { utils as sdkUtils } from "@across-protocol/sdk";
const { getDeployedAddress } = sdkUtils;

import { ChainConfig } from "../types";

const chainId = CHAIN_IDs.MODE;
const chainInfoBase = PUBLIC_NETWORKS[chainId];

export default {
  ...chainInfoBase,
  logoPath: "./assets/logo.svg",
  grayscaleLogoPath: "./assets/grayscale-logo.svg",
  spokePool: getDeployedAddress("SpokePool", chainId),
  chainId,
  publicRpcUrl: "https://mainnet.mode.network",
  tokens: [
    "WETH",
    "ETH",
    "USDC.e",
    { symbol: "USDT", chainIds: [CHAIN_IDs.MAINNET] },
    { symbol: "WBTC", chainIds: [CHAIN_IDs.MAINNET] },
  ],
  enableCCTP: false,
  swapTokens: [],
} as ChainConfig;
