import { CHAIN_IDs, PUBLIC_NETWORKS } from "@across-protocol/constants";
import { utils as sdkUtils } from "@across-protocol/sdk";
const { getDeployedAddress } = sdkUtils;

import { ChainConfig } from "../types";

const chainId = CHAIN_IDs.LINEA;
const chainInfoBase = PUBLIC_NETWORKS[chainId];

export default {
  ...chainInfoBase,
  logoPath: "./assets/logo.svg",
  grayscaleLogoPath: "./assets/grayscale-logo.svg",
  spokePool: getDeployedAddress("SpokePool", chainId),
  chainId,
  publicRpcUrl: "https://rpc.linea.build",
  tokens: ["WETH", "ETH", "USDC.e", "USDT", "DAI", "WBTC"],
  enableCCTP: false,
  swapTokens: [],
} as ChainConfig;
