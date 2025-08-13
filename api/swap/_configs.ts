import { CHAIN_IDs } from "../_constants";
import { getWrappedGhoStrategy } from "../_dexes/gho/wrapped-gho";
import { getWghoMulticallStrategy } from "../_dexes/gho/multicall";
import { getUniversalRouter02Strategy } from "../_dexes/uniswap/universal-router-02";
import { getSwapRouter02Strategy } from "../_dexes/uniswap/swap-router-02";
import { get0xStrategy } from "../_dexes/0x/allowance-holder";
import { getLifiStrategy } from "../_dexes/lifi/lifi-router";

import { QuoteFetchStrategies } from "../_dexes/utils";

export const quoteFetchStrategies: QuoteFetchStrategies = {
  prioritizationMode: {
    mode: "priority-speed",
    priorityChunkSize: 1,
  },
  default: [
    get0xStrategy("SpokePoolPeriphery"),
    getLifiStrategy("SpokePoolPeriphery"),
    getUniversalRouter02Strategy(),
  ],
  chains: {
    [CHAIN_IDs.LENS]: [
      getSwapRouter02Strategy("SpokePoolPeriphery", "sdk-swap-quoter"),
    ],
  },
  swapPairs: {
    [CHAIN_IDs.MAINNET]: {
      GHO: {
        WGHO: [getWrappedGhoStrategy()],
      },
      WGHO: {
        GHO: [getWrappedGhoStrategy()],
        USDC: [getWrappedGhoStrategy()],
        USDT: [getWrappedGhoStrategy()],
        DAI: [getWrappedGhoStrategy()],
      },
      USDC: {
        WGHO: [getWghoMulticallStrategy()],
      },
      USDT: {
        WGHO: [getWghoMulticallStrategy()],
      },
      DAI: {
        WGHO: [getWghoMulticallStrategy()],
      },
    },
  },
};
