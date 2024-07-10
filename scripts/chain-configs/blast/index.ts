import { CHAIN_IDs, PUBLIC_NETWORKS } from "@across-protocol/constants";
import { ChainConfig } from "../types";

const chainId = CHAIN_IDs.BLAST;
const chainInfoBase = PUBLIC_NETWORKS[chainId];

export default {
  ...chainInfoBase,
  logoPath: "./assets/logo.svg",
  grayscaleLogoPath: "./assets/grayscale-logo.svg",
  spokePool: "0x2D509190Ed0172ba588407D4c2df918F955Cc6E1",
  chainId,
  publicRpcUrl: "https://blast.din.dev/rpc",
  blockTimeSeconds: 2,
  tokens: ["WETH", "ETH", "USDB", "WBTC"],
  enableCCTP: false,
  swapTokens: [],
} as ChainConfig;
