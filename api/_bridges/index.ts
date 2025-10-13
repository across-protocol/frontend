import { getAcrossBridgeStrategy } from "./across/strategy";
import { getHyperCoreBridgeStrategy } from "./hypercore/strategy";
import { BridgeStrategiesConfig } from "./types";
import { CHAIN_IDs } from "../_constants";
import { getCctpBridgeStrategy } from "./cctp/strategy";
import { Token } from "../_dexes/types";

export const bridgeStrategies: BridgeStrategiesConfig = {
  default: getAcrossBridgeStrategy(),
  fromToChains: {
    [CHAIN_IDs.HYPEREVM]: {
      [CHAIN_IDs.HYPERCORE]: getHyperCoreBridgeStrategy(),
    },
    [CHAIN_IDs.HYPERCORE]: {
      [CHAIN_IDs.HYPEREVM]: getHyperCoreBridgeStrategy(),
    },
  },
  inputTokens: {
    USDC: {
      [CHAIN_IDs.HYPEREVM]: {
        [CHAIN_IDs.HYPERCORE]: getCctpBridgeStrategy(),
      },
      [CHAIN_IDs.HYPEREVM_TESTNET]: {
        [CHAIN_IDs.HYPERCORE_TESTNET]: getCctpBridgeStrategy(),
      },
    },
  },
  // TODO: Add CCTP routes when ready
};

// TODO: Extend the strategy selection based on more sophisticated logic when we start
// implementing burn/mint bridges.
export function getBridgeStrategy({
  inputToken,
  outputToken,
}: {
  inputToken: Token;
  outputToken: Token;
}) {
  const fromToChainOverride =
    bridgeStrategies.fromToChains?.[inputToken.chainId]?.[outputToken.chainId];
  const inputTokenOverride =
    bridgeStrategies.inputTokens?.[inputToken.symbol]?.[inputToken.chainId]?.[
      outputToken.chainId
    ];
  return inputTokenOverride ?? fromToChainOverride ?? bridgeStrategies.default;
}
