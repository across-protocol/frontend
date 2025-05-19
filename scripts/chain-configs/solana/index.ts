import { CHAIN_IDs, PUBLIC_NETWORKS } from "@across-protocol/constants";
import { utils as sdkUtils } from "@across-protocol/sdk";
import { ChainConfig } from "../types";

const { getDeployedAddress, getDeployedBlockNumber } = sdkUtils;

const chainId = CHAIN_IDs.SOLANA;
const chainInfoBase = PUBLIC_NETWORKS[chainId];

export default {
  ...chainInfoBase,
  logoPath: "./assets/logo.svg",
  grayscaleLogoPath: "./assets/grayscale-logo.svg",
  spokePool: {
    address: getDeployedAddress("SvmSpoke", chainId),
    blockNumber: getDeployedBlockNumber("SvmSpoke", chainId),
  },
  chainId,
  publicRpcUrl: chainInfoBase.publicRPC,
  blockTimeSeconds: 0.5,
  tokens: ["USDC"],
  enableCCTP: false,
} as ChainConfig;
