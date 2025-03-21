import {
  SwapAndBridge__factory,
  UniversalSwapAndBridge__factory,
} from "@across-protocol/contracts";

import { ENABLED_ROUTES, getProvider } from "./_utils";

type SwapAndBridgeType = "SwapAndBridge" | "UniversalSwapAndBridge";

export class UnsupportedDex extends Error {
  constructor(dex: string, type: SwapAndBridgeType) {
    super(`DEX/Aggregator '${dex}' not supported for '${type}'`);
  }
}

export class UnsupportedDexOnChain extends Error {
  constructor(chainId: number, dex: string, type: SwapAndBridgeType) {
    super(
      `DEX/Aggregator '${dex}' not supported on chain ${chainId} for '${type}'`
    );
  }
}

export class NoSwapRouteError extends Error {
  constructor(args: {
    dex: string;
    tokenInSymbol: string;
    tokenOutSymbol: string;
    chainId: number;
    swapType: string;
  }) {
    super(
      `No ${args.dex} swap route found for '${args.swapType}' ${args.tokenInSymbol} to ${args.tokenOutSymbol} on chain ${args.chainId}`
    );
  }
}

export const swapAndBridgeDexes = Object.keys(
  ENABLED_ROUTES.swapAndBridgeAddresses
);

export const universalSwapAndBridgeDexes = Object.keys(
  ENABLED_ROUTES.universalSwapAndBridgeAddresses
);

export function getSwapAndBridgeAddress(dex: string, chainId: number) {
  if (!_isDexSupportedForSwapAndBridge(dex)) {
    throw new UnsupportedDex(dex, "SwapAndBridge");
  }

  const address = (
    ENABLED_ROUTES.swapAndBridgeAddresses[dex] as Record<string, string>
  )?.[chainId];
  if (!address) {
    throw new UnsupportedDexOnChain(chainId, dex, "SwapAndBridge");
  }
  return address;
}

export function getUniversalSwapAndBridgeAddress(dex: string, chainId: number) {
  if (!_isDexSupportedForUniversalSwapAndBridge(dex)) {
    throw new UnsupportedDex(dex, "UniversalSwapAndBridge");
  }

  const address = (
    ENABLED_ROUTES.universalSwapAndBridgeAddresses[dex] as Record<
      string,
      string
    >
  )?.[chainId];
  if (!address) {
    throw new UnsupportedDexOnChain(chainId, dex, "UniversalSwapAndBridge");
  }
  return address;
}

export function getSwapAndBridge(dex: string, chainId: number) {
  const swapAndBridgeAddress = getSwapAndBridgeAddress(dex, chainId);

  return SwapAndBridge__factory.connect(
    swapAndBridgeAddress,
    getProvider(chainId)
  );
}

export function getUniversalSwapAndBridge(dex: string, chainId: number) {
  const universalSwapAndBridgeAddress = getUniversalSwapAndBridgeAddress(
    dex,
    chainId
  );

  return UniversalSwapAndBridge__factory.connect(
    universalSwapAndBridgeAddress,
    getProvider(chainId)
  );
}

function _isDexSupportedForSwapAndBridge(
  dex: string
): dex is keyof typeof ENABLED_ROUTES.swapAndBridgeAddresses {
  return swapAndBridgeDexes.includes(dex);
}

function _isDexSupportedForUniversalSwapAndBridge(
  dex: string
): dex is keyof typeof ENABLED_ROUTES.universalSwapAndBridgeAddresses {
  return universalSwapAndBridgeDexes.includes(dex);
}
