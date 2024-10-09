import { CHAIN_IDs, PUBLIC_NETWORKS } from "@across-protocol/constants";
import { utils as sdkUtils } from "@across-protocol/sdk";
import { ChainConfig } from "../types";

const { getDeployedAddress } = sdkUtils;

const chainId = CHAIN_IDs.WORLD_CHAIN;
const chainInfoBase = PUBLIC_NETWORKS[chainId];

export default {
  ...chainInfoBase,
  fullName: "World Chain",
  logoPath: "./assets/logo.svg",
  grayscaleLogoPath: "./assets/grayscale-logo.svg",
  spokePool: getDeployedAddress("SpokePool", chainId),
  chainId,
  publicRpcUrl: "https://worldchain-mainnet.g.alchemy.com/public",
  blockTimeSeconds: 2,
  tokens: ["WBTC", "WETH"], // "USDC.e" disabled for now
  enableCCTP: false,
} as ChainConfig;
