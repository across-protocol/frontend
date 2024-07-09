import { CHAIN_IDs, PUBLIC_NETWORKS } from "@across-protocol/constants";
import { ChainConfig } from "../types";

const chainId = CHAIN_IDs.LISK;
const chainInfoBase = PUBLIC_NETWORKS[chainId];

export default {
  ...chainInfoBase,
  logoPath: "./assets/logo.svg",
  grayscaleLogoPath: "./assets/grayscale-logo.svg",
  spokePool: "0x9552a0a6624A23B848060AE5901659CDDa1f83f8",
  chainId,
  publicRpcUrl: "https://rpc.api.lisk.com",
  tokens: ["WETH", "ETH", "USDT"],
  enableCCTP: false,
  swapTokens: [],
} as ChainConfig;
