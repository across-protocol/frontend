import {
  BridgeStrategiesConfig,
  BridgeStrategy,
  BridgeStrategyData,
  BridgeStrategyDataParams,
  GetBridgeStrategyParams,
} from "./types";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../_constants";
import { getBridgeStrategyData } from "./utils";
import { getAcrossBridgeStrategy } from "./across/strategy";
import { getCctpBridgeStrategy } from "./cctp/strategy";
import { getOftBridgeStrategy } from "./oft/strategy";
import { getHyperCoreBridgeStrategy } from "./hypercore/strategy";
import { getUsdhIntentsBridgeStrategy } from "./sponsored-intent/strategy";

export const bridgeStrategies: BridgeStrategiesConfig = {
  default: getAcrossBridgeStrategy(),
  tokenPairPerToChain: {
    [CHAIN_IDs.HYPEREVM]: {
      [TOKEN_SYMBOLS_MAP.USDC.symbol]: {
        [TOKEN_SYMBOLS_MAP.USDH.symbol]: getUsdhIntentsBridgeStrategy(),
      },
      // NOTE: Disable origin BSC until we have an easier way to rebalance off BSC
      // [TOKEN_SYMBOLS_MAP["USDC-BNB"].symbol]: {
      //   [TOKEN_SYMBOLS_MAP.USDH.symbol]: getUsdhIntentsBridgeStrategy(),
      // },
    },
    [CHAIN_IDs.HYPERCORE]: {
      [TOKEN_SYMBOLS_MAP.USDC.symbol]: {
        [TOKEN_SYMBOLS_MAP["USDH-SPOT"].symbol]: getUsdhIntentsBridgeStrategy(),
      },
      // NOTE: Disable origin BSC until we have an easier way to rebalance off BSC
      // [TOKEN_SYMBOLS_MAP["USDC-BNB"].symbol]: {
      //   [TOKEN_SYMBOLS_MAP["USDH-SPOT"].symbol]: getUsdhIntentsBridgeStrategy(),
      // },
    },
  },
  fromToChains: {
    [CHAIN_IDs.HYPEREVM]: {
      [CHAIN_IDs.HYPERCORE]: getHyperCoreBridgeStrategy(),
    },
    [CHAIN_IDs.HYPERCORE]: {
      [CHAIN_IDs.HYPEREVM]: getHyperCoreBridgeStrategy(),
    },
  },
  // TODO: Add CCTP routes when ready
};

export const routableBridgeStrategies = [
  getAcrossBridgeStrategy(),
  getCctpBridgeStrategy(),
  getOftBridgeStrategy(),
];

export async function getBridgeStrategy({
  originChainId,
  destinationChainId,
  inputToken,
  outputToken,
  amount,
  amountType,
  recipient,
  depositor,
  includesActions,
  routingPreference = "default",
}: GetBridgeStrategyParams): Promise<BridgeStrategy> {
  const tokenPairPerToChainOverride =
    bridgeStrategies.tokenPairPerToChain?.[destinationChainId]?.[
      inputToken.symbol
    ]?.[outputToken.symbol];
  if (tokenPairPerToChainOverride) {
    return tokenPairPerToChainOverride;
  }

  const fromToChainOverride =
    bridgeStrategies.fromToChains?.[originChainId]?.[destinationChainId];
  if (fromToChainOverride) {
    return fromToChainOverride;
  }

  const supportedBridgeStrategies = getSupportedBridgeStrategies({
    inputToken,
    outputToken,
    routingPreference,
  });

  if (supportedBridgeStrategies.length === 1) {
    return supportedBridgeStrategies[0];
  }
  if (
    supportedBridgeStrategies.some(
      (strategy) =>
        strategy.name === getCctpBridgeStrategy().name ||
        strategy.name === getOftBridgeStrategy().name
    )
  ) {
    return routeMintAndBurnStrategy({
      inputToken,
      outputToken,
      amount,
      amountType,
      recipient,
      depositor,
      includesActions,
    });
  }
  return getAcrossBridgeStrategy();
}

export function getSupportedBridgeStrategies({
  inputToken,
  outputToken,
  routingPreference,
}: {
  inputToken: GetBridgeStrategyParams["inputToken"];
  outputToken: GetBridgeStrategyParams["outputToken"];
  routingPreference: string;
}) {
  const routingPreferenceFilter = (strategyName: string) => {
    // If default routing preference, don't filter based on name
    if (routingPreference === "default") {
      return true;
    }

    // If native routing preference, filter out 'across' bridge strategy
    if (routingPreference === "native") {
      return strategyName !== "across";
    }

    // Else use across bridge strategy
    return strategyName === "across";
  };
  const supportedBridgeStrategies = routableBridgeStrategies.filter(
    (strategy) =>
      strategy.isRouteSupported({ inputToken, outputToken }) &&
      routingPreferenceFilter(strategy.name)
  );
  return supportedBridgeStrategies;
}

async function routeMintAndBurnStrategy({
  inputToken,
  outputToken,
  amount,
  amountType,
  recipient,
  depositor,
  includesActions,
}: BridgeStrategyDataParams): Promise<BridgeStrategy> {
  const bridgeStrategyData = await getBridgeStrategyData({
    inputToken,
    outputToken,
    amount,
    amountType,
    recipient,
    depositor,
  });

  if (!bridgeStrategyData) {
    return bridgeStrategies.default;
  }

  // Always use Across when actions are present
  if (includesActions) {
    return getAcrossBridgeStrategy();
  }

  if (bridgeStrategyData.isMonadTransfer) {
    if (bridgeStrategyData.isWithinMonadLimit) {
      return getAcrossBridgeStrategy();
    }
    if (bridgeStrategyData.isUsdtToUsdt) {
      return getOftBridgeStrategy();
    }
    if (bridgeStrategyData.isUsdcToUsdc) {
      return getCctpBridgeStrategy();
    } else {
      return getAcrossBridgeStrategy();
    }
  }
  if (!bridgeStrategyData.isUsdcToUsdc && !bridgeStrategyData.isUsdtToUsdt) {
    return getAcrossBridgeStrategy();
  }
  if (bridgeStrategyData.isUtilizationHigh) {
    return getBurnAndMintStrategy(bridgeStrategyData);
  }

  if (bridgeStrategyData.isFastCctpEligible) {
    if (bridgeStrategyData.isInThreshold) {
      return getAcrossBridgeStrategy();
    }
    if (bridgeStrategyData.isLargeCctpDeposit) {
      return getAcrossBridgeStrategy();
    } else {
      return getBurnAndMintStrategy(bridgeStrategyData);
    }
  }
  if (bridgeStrategyData.canFillInstantly) {
    return getAcrossBridgeStrategy();
  } else {
    if (
      bridgeStrategyData.isUsdcToUsdc &&
      bridgeStrategyData.isLargeCctpDeposit
    ) {
      return getAcrossBridgeStrategy();
    } else {
      return getBurnAndMintStrategy(bridgeStrategyData);
    }
  }
}

function getBurnAndMintStrategy(bridgeStrategyData: BridgeStrategyData) {
  if (!bridgeStrategyData) {
    return getAcrossBridgeStrategy();
  }
  if (bridgeStrategyData.isUsdcToUsdc) {
    return getCctpBridgeStrategy();
  }
  if (bridgeStrategyData.isUsdtToUsdt) {
    return getOftBridgeStrategy();
  }
  return getAcrossBridgeStrategy();
}
