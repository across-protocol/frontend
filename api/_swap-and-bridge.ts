import { SwapAndBridge__factory } from "@across-protocol/contracts-v4.1.1";

import { ENABLED_ROUTES, getProvider } from "./_utils";

export class UnsupportedDex extends Error {
  constructor(dex: string) {
    super(`DEX/Aggregator '${dex}' not supported for 'SwapAndBridge'`);
  }
}

export class UnsupportedDexOnChain extends Error {
  constructor(chainId: number, dex: string) {
    super(
      `DEX/Aggregator '${dex}' not supported on chain ${chainId} for 'SwapAndBridge'`
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

export function getSwapAndBridgeAddress(dex: string, chainId: number) {
  if (!_isDexSupportedForSwapAndBridge(dex)) {
    throw new UnsupportedDex(dex);
  }

  const address = (
    ENABLED_ROUTES.swapAndBridgeAddresses[dex] as Record<string, string>
  )?.[chainId];
  if (!address) {
    throw new UnsupportedDexOnChain(chainId, dex);
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

function _isDexSupportedForSwapAndBridge(
  dex: string
): dex is keyof typeof ENABLED_ROUTES.swapAndBridgeAddresses {
  return swapAndBridgeDexes.includes(dex);
}
