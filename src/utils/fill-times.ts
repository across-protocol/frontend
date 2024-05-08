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

export function getFastFillTimeByRoute(
  fromChainId: number,
  toChainId: number,
  tokenSymbol: string
) {
  const fromChainName = chainIdToPresetChainName[fromChainId];
  const toChainName = chainIdToPresetChainName[toChainId];

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
  )?.["APPROX_QUANTILES(fill_time_secs, 100)[OFFSET(75)]"];

  return fillTimeInSeconds || 60;
}
