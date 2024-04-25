import { CHAIN_IDs } from "../_constants";

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

export const swapAndBridgeAddresses = {
  uniswap: {
    [CHAIN_IDs.POLYGON]: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
  },
  "1inch": {
    [CHAIN_IDs.POLYGON]: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
  },
} as const;

export const swapAndBridgeDexes = Object.keys(swapAndBridgeAddresses);

export function getSwapAndBridgeAddress(
  dex: keyof typeof swapAndBridgeAddresses,
  chainId: number
) {
  if (!swapAndBridgeDexes.includes(dex)) {
    throw new UnsupportedDex(dex);
  }

  const address = swapAndBridgeAddresses[dex]?.[chainId];
  if (!address) {
    throw new UnsupportedDexOnChain(chainId, dex);
  }
  return address;
}
