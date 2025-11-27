import { CHAIN_IDs } from "@across-protocol/constants";
import { ChainConfig } from "../types";

export default {
  chainId: 1337, // Arbitrary chain id for HyperCore
  name: "HyperCore",
  fullName: "HyperCore",
  logoPath: "./assets/logo.svg",
  grayscaleLogoPath: "./assets/grayscale-logo.svg",
  spokePool: {
    address: "0x0000000000000000000000000000000000000000",
    blockNumber: 0,
  },
  publicRpcUrl: "https://api.hyperliquid.xyz",
  blockExplorer: "https://app.hyperliquid.xyz/explorer",
  blockTimeSeconds: 1,
  tokens: [],
  inputTokens: [],
  outputTokens: ["USDH-SPOT"],
  enableCCTP: false,
  omitViemConfig: true,
  nativeToken: "HYPE",
  // HyperCore can only be reached via HyperEVM as an intermediary chain.
  intermediaryChain: CHAIN_IDs.HYPEREVM,
  restrictedOriginChains: [CHAIN_IDs.BSC, CHAIN_IDs.LISK, CHAIN_IDs.HYPEREVM], // this list should always include the intermediary chain
} as ChainConfig;
