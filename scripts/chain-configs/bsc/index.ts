import { CHAIN_IDs, PUBLIC_NETWORKS } from "@across-protocol/constants";
import { utils as sdkUtils } from "@across-protocol/sdk";
import { ChainConfig } from "../types";

const { getDeployedAddress, getDeployedBlockNumber } = sdkUtils;

const chainId = CHAIN_IDs.BSC;
const chainInfoBase = PUBLIC_NETWORKS[chainId];

export default {
  ...chainInfoBase,
  fullName: "BNB Smart Chain",
  logoPath: "./assets/logo.svg",
  grayscaleLogoPath: "./assets/grayscale-logo.svg",
  spokePool: {
    // TODO: use correct addresses
    // address: getDeployedAddress("SpokePool", chainId),
    // blockNumber: getDeployedBlockNumber("SpokePool", chainId),
    address: "0x4e8E101924eDE233C13e2D8622DC8aED2872d505",
    blockNumber: 48762335,
  },
  chainId,
  publicRpcUrl: chainInfoBase.publicRPC,
  blockTimeSeconds: 3,
  tokens: ["USDC-BNB", "USDT-BNB", "BNB", "CAKE", "ETH"],
  enableCCTP: false,
} as ChainConfig;
