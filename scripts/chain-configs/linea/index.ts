import { CHAIN_IDs, PUBLIC_NETWORKS } from "@across-protocol/constants";
import { utils as sdkUtils } from "@across-protocol/sdk";
const { getDeployedAddress, getDeployedBlockNumber } = sdkUtils;

import { ChainConfig } from "../types";

const chainId = CHAIN_IDs.LINEA;
const chainInfoBase = PUBLIC_NETWORKS[chainId];

export default {
  ...chainInfoBase,
  logoPath: "./assets/logo.svg",
  grayscaleLogoPath: "./assets/grayscale-logo.svg",
  spokePool: {
    address: getDeployedAddress("SpokePool", chainId),
    blockNumber: getDeployedBlockNumber("SpokePool", chainId),
  },
  chainId,
  blockTimeSeconds: 2,
  publicRpcUrl: "https://rpc.linea.build",
  tokens: ["WETH", "ETH", "USDC", "USDT", "DAI", "WBTC"],
  enableCCTP: false,
  swapTokens: [],
} as ChainConfig;
