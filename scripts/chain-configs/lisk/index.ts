import { CHAIN_IDs, PUBLIC_NETWORKS } from "@across-protocol/constants";
import { ChainConfig } from "../types";
import { utils as sdkUtils } from "@across-protocol/sdk";
const { getDeployedAddress, getDeployedBlockNumber } = sdkUtils;

const chainId = CHAIN_IDs.LISK;
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
  publicRpcUrl: "https://rpc.api.lisk.com",
  tokens: ["WETH", "ETH", "USDC.e", "USDT", "LSK", "WBTC"],
  enableCCTP: false,
  swapTokens: [],
} as ChainConfig;
