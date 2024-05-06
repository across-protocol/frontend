import { ENABLED_ROUTES } from "../_utils";

export class UnsupportedDex extends Error {
  constructor(dex: string) {
    super(`DEX/Aggregator ${dex} not supported`);
  }
}

export class UnsupportedDexOnChain extends Error {
  constructor(chainId: number, dex: string) {
    super(`DEX/Aggregator ${dex} not supported on chain ${chainId}`);
  }
}

export const swapAndBridgeDexes = Object.keys(
  ENABLED_ROUTES.swapAndBridgeAddresses
);

export function getSwapAndBridgeAddress(dex: string, chainId: number) {
  if (!_isDexSupported(dex)) {
    throw new UnsupportedDex(dex);
  }

  const address = ENABLED_ROUTES.swapAndBridgeAddresses[dex]?.[chainId];
  if (!address) {
    throw new UnsupportedDexOnChain(chainId, dex);
  }
  return address;
}

function _isDexSupported(
  dex: string
): dex is keyof typeof ENABLED_ROUTES.swapAndBridgeAddresses {
  return swapAndBridgeDexes.includes(dex);
}
