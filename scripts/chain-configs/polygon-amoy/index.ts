import { CHAIN_IDs, PUBLIC_NETWORKS } from "@across-protocol/constants";
import { utils as sdkUtils } from "@across-protocol/sdk";
import { ChainConfig } from "../types";

const { getDeployedAddress, getDeployedBlockNumber } = sdkUtils;

const chainId = CHAIN_IDs.POLYGON_AMOY;
const chainInfoBase = PUBLIC_NETWORKS[chainId];

export default {
  ...chainInfoBase,
  fullName: "Polygon Amoy",
  logoPath: "../polygon/assets/logo.svg",
  grayscaleLogoPath: "../polygon/assets/grayscale-logo.svg",
  spokePool: {
    address: getDeployedAddress("SpokePool", chainId),
    blockNumber: getDeployedBlockNumber("SpokePool", chainId),
  },
  chainId,
  publicRpcUrl: "https://rpc-amoy.polygon.technology",
  tokens: ["WETH", "TATARA-USDC"],
  enableCCTP: false,
  swapTokens: [],
} as ChainConfig;
