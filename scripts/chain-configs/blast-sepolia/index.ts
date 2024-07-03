import { CHAIN_IDs, PUBLIC_NETWORKS } from "@across-protocol/constants";
import { ChainConfig } from "../types";

const chainId = CHAIN_IDs.BLAST_SEPOLIA;
const chainInfoBase = PUBLIC_NETWORKS[chainId];

export default {
  ...chainInfoBase,
  logoPath: "../blast/assets/logo.svg",
  grayscaleLogoPath: "../blast/assets/grayscale-logo.svg",
  spokePool: "0x5545092553Cf5Bf786e87a87192E902D50D8f022",
  chainId,
  publicRpcUrl: "https://sepolia.blast.io",
  blockTimeSeconds: 2,
  tokens: ["WETH", "ETH"],
  enableCCTP: false,
  swapTokens: [],
} as ChainConfig;
