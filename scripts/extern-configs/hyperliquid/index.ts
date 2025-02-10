import { CHAIN_IDs } from "@across-protocol/constants";
import { ExternalProjectConfig } from "../types";

export default {
  name: "Hyperliquid",
  projectId: "hyperliquid",
  explorer: "https://arbiscan.io",
  logoPath: "./assets/logo.svg",
  grayscaleLogoPath: "./assets/grayscale-logo.svg",
  publicRpcUrl: "https://arbitrum.publicnode.com",
  intermediaryChain: CHAIN_IDs.ARBITRUM,
  tokens: ["USDC", "USDC.e"],
} as ExternalProjectConfig;
