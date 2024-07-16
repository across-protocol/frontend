import { CHAIN_IDs, PUBLIC_NETWORKS } from "@across-protocol/constants";
// import { utils as sdkUtils } from "@across-protocol/sdk";
import { ChainConfig } from "../types";

// const { getDeployedAddress } = sdkUtils;

const chainId = CHAIN_IDs.SCROLL;
const chainInfoBase = PUBLIC_NETWORKS[chainId];

export default {
  ...chainInfoBase,
  logoPath: "./assets/logo.svg",
  grayscaleLogoPath: "./assets/grayscale-logo.svg",
  // spokePool: getDeployedAddress("SpokePool", chainId),
  spokePool: "0x3baD7AD0728f9917d1Bf08af5782dCbD516cDd96",
  chainId,
  publicRpcUrl: "https://rpc.scroll.io",
  blockTimeSeconds: 5,
  tokens: ["WETH", "ETH", "USDC", "USDT", "WBTC"],
  enableCCTP: false,
  swapTokens: [],
} as ChainConfig;
