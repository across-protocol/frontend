import { ENABLED_ROUTES } from "./_utils";

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

export function getSwapAndBridgeAddress(dex: string, chainId: number) {
  const addresses = ENABLED_ROUTES.swapAndBridgeAddresses as Record<
    string,
    Record<string, string>
  >;

  if (!(dex in addresses)) {
    throw new UnsupportedDex(dex);
  }

  const address = addresses[dex]?.[chainId];
  if (!address) {
    throw new UnsupportedDexOnChain(chainId, dex);
  }
  return address;
}
