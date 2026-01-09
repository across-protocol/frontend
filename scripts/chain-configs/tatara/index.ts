import { CHAIN_IDs, PUBLIC_NETWORKS } from "@across-protocol/constants";
import { utils as sdkUtils } from "@across-protocol/sdk";
import { ChainConfig } from "../types";

const { getDeployedAddress, getDeployedBlockNumber } = sdkUtils;

const chainId = CHAIN_IDs.TATARA;
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
  publicRpcUrl:
    "https://rpc.tatara.katanarpc.com/DYsaaqa6zme7taA8LskCQnkAZghSPtPQk",
  blockTimeSeconds: 1,
  tokens: ["TATARA-USDC", "WETH"],
  enableCCTP: false,
} as ChainConfig;
