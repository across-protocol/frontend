import { CHAIN_IDs, PUBLIC_NETWORKS } from "@across-protocol/constants";
import { utils as sdkUtils } from "@across-protocol/sdk";
const { getDeployedAddress } = sdkUtils;

import { ChainConfig } from "../types";

const chainId = CHAIN_IDs.MODE;
const chainInfoBase = PUBLIC_NETWORKS[chainId];

export default {
  ...chainInfoBase,
  logoPath: "./assets/logo.svg",
  grayscaleLogoPath: "./assets/grayscale-logo.svg",
  spokePool: getDeployedAddress("SpokePool", chainId),
  chainId,
  publicRpcUrl: "https://mainnet.mode.network",
  tokens: [
    "WETH",
    "ETH",
    "USDC.e",
    "USDT",
    {
      symbol: "WBTC",
      // NOTE: We need to whitelist these chains because the route WBTC Mode <-> Arbitrum
      // is not enabled by yet. As soon as it is enabled, we can remove this whitelist.
      chainIds: [
        CHAIN_IDs.MAINNET,
        CHAIN_IDs.POLYGON,
        CHAIN_IDs.ZK_SYNC,
        CHAIN_IDs.OPTIMISM,
        CHAIN_IDs.LINEA,
      ],
    },
  ],
  enableCCTP: false,
  swapTokens: [],
} as ChainConfig;
