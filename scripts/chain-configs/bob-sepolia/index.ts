import { CHAIN_IDs, PUBLIC_NETWORKS } from "@across-protocol/constants";
import { utils as sdkUtils } from "@across-protocol/sdk";
import { ChainConfig } from "../types";

const { getDeployedAddress, getDeployedBlockNumber } = sdkUtils;

const chainId = CHAIN_IDs.BOB_SEPOLIA;
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
  publicRpcUrl: "https://bob-sepolia.rpc.gobob.xyz",
  blockTimeSeconds: 1,
  tokens: ["ETH", "WETH", "WBTC"],
  enableCCTP: false,
} as ChainConfig;
