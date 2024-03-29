import { ChainId } from "./constants";

// Based on avg. fill times for 75th percentile of past bridge transfers
const fastFillTimesSecondsFromTo = {
  [ChainId.MAINNET]: {
    [ChainId.OPTIMISM]: 32,
    [ChainId.POLYGON]: 322.5,
    [ChainId.ZK_SYNC]: 78.75,
    [ChainId.BASE]: 174,
    [ChainId.ARBITRUM]: 122,
  },
  [ChainId.OPTIMISM]: {
    [ChainId.MAINNET]: 12,
    [ChainId.POLYGON]: 388,
    [ChainId.ZK_SYNC]: 6,
    [ChainId.BASE]: 148,
    [ChainId.ARBITRUM]: 9,
  },
  [ChainId.POLYGON]: {
    [ChainId.MAINNET]: 70,
    [ChainId.OPTIMISM]: 62,
    [ChainId.ZK_SYNC]: 58,
    [ChainId.BASE]: 178,
    [ChainId.ARBITRUM]: 69,
  },
  [ChainId.ZK_SYNC]: {
    [ChainId.MAINNET]: 12,
    [ChainId.OPTIMISM]: 416,
    [ChainId.POLYGON]: 20,
    [ChainId.BASE]: 149,
    [ChainId.ARBITRUM]: 237,
  },
  [ChainId.BASE]: {
    [ChainId.MAINNET]: 12,
    [ChainId.OPTIMISM]: 68,
    [ChainId.POLYGON]: 144,
    [ChainId.ZK_SYNC]: 5,
    [ChainId.ARBITRUM]: 7,
  },
  [ChainId.ARBITRUM]: {
    [ChainId.MAINNET]: 12,
    [ChainId.OPTIMISM]: 247,
    [ChainId.POLYGON]: 111,
    [ChainId.ZK_SYNC]: 5,
    [ChainId.BASE]: 139,
  },
};

export function getFastFillTimeByRoute(fromChainId: number, toChainId: number) {
  const fillTimeInSeconds =
    fastFillTimesSecondsFromTo[fromChainId]?.[toChainId];

  return fillTimeInSeconds || 60;
}
