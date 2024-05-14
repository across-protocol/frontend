import { ChainId } from "./constants";

// Raw json from https://3251bbf8.us2a.app.preset.io/superset/explore/p/ZxKyKB6om5P
import rawAvgFillTimesPreset from "../data/fill-times-preset.json";

const chainIdToPresetChainName = {
  [ChainId.MAINNET]: "ethereum",
  [ChainId.ARBITRUM]: "arbitrum",
  [ChainId.BASE]: "base",
  [ChainId.POLYGON]: "polygon",
  [ChainId.LINEA]: "linea",
  [ChainId.OPTIMISM]: "optimism",
  [ChainId.ZK_SYNC]: "zksync",
};

const fillTimeOverrides: {
  [tokenSymbol: string]: {
    origin_chain: string;
    destination_chain: string;
    fill_time_seconds: number;
  }[];
} = {
  SNX: [
    {
      origin_chain: "ethereum",
      destination_chain: "optimism",
      fill_time_seconds: 9_000, // 2.5 hours
    },
    {
      origin_chain: "optimism",
      destination_chain: "ethereum",
      fill_time_seconds: 9_000, // 2.5 hours
    },
  ],
};

export function getFastFillTimeByRoute(
  fromChainId: number,
  toChainId: number,
  tokenSymbol: string
) {
  const fromChainName = chainIdToPresetChainName[fromChainId];
  const toChainName = chainIdToPresetChainName[toChainId];

  const overrides = fillTimeOverrides[tokenSymbol];

  if (overrides) {
    const override = overrides.find(
      (entry) =>
        entry.origin_chain === fromChainName &&
        entry.destination_chain === toChainName
    );

    if (override) {
      return override.fill_time_seconds;
    }
  }

  const symbolFilter = ["ETH", "WETH"].includes(tokenSymbol)
    ? "WETH"
    : ["USDC", "USDC.e", "USDbC"].includes(tokenSymbol)
    ? "USDC"
    : "DAI";

  const fillTimeInSeconds = rawAvgFillTimesPreset.result[0].data.find(
    (entry) =>
      entry.origin_chain === fromChainName &&
      entry.destination_chain === toChainName &&
      entry.origin_symbol === symbolFilter
  )?.fill_time_seconds;

  return fillTimeInSeconds || 60;
}
