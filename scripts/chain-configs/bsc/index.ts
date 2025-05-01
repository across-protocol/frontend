import { CHAIN_IDs, PUBLIC_NETWORKS } from "@across-protocol/constants";
import { utils as sdkUtils } from "@across-protocol/sdk";
import { ChainConfig } from "../types";

const { getDeployedAddress, getDeployedBlockNumber } = sdkUtils;

const chainId = CHAIN_IDs.BSC;
const chainInfoBase = PUBLIC_NETWORKS[chainId];

export default {
  ...chainInfoBase,
  logoPath: "./assets/logo.svg",
  grayscaleLogoPath: "./assets/grayscale-logo.svg",
  spokePool: {
    // TODO: use correct addresses
    // address: getDeployedAddress("SpokePool", chainId),
    // blockNumber: getDeployedBlockNumber("SpokePool", chainId),
    address: "0x0000000000000000000000000000000000000000",
    blockNumber: 0,
  },
  chainId,
  publicRpcUrl: chainInfoBase.publicRPC,
  blockTimeSeconds: 15,
  tokens: ["USDC-BNB", "USDT-BNB"],
  enableCCTP: false,
} as ChainConfig;
