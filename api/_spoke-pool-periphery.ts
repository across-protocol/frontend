import { SpokePoolV3Periphery__factory } from "./_typechain/factories/SpokePoolV3Periphery";
import { ENABLED_ROUTES, getProvider } from "./_utils";

export class UnknownPeripheryForDexOnChain extends Error {
  constructor(chainId: number, dex: string) {
    super(`Unknown SpokePoolPeriphery for DEX ${dex} on chain ${chainId}`);
  }
}

export const spokePoolPeripheryDexes = Object.keys(
  ENABLED_ROUTES.spokePoolPeripheryAddresses
);

export function getSpokePoolPeripheryAddress(dex: string, chainId: number) {
  if (!_isDexSupported(dex)) {
    throw new UnknownPeripheryForDexOnChain(chainId, dex);
  }

  const address = (
    ENABLED_ROUTES.spokePoolPeripheryAddresses[dex] as Record<string, string>
  )?.[chainId];
  if (!address) {
    throw new UnknownPeripheryForDexOnChain(chainId, dex);
  }
  return address;
}

export function getSpokePoolPeriphery(dex: string, chainId: number) {
  const address = getSpokePoolPeripheryAddress(dex, chainId);

  return SpokePoolV3Periphery__factory.connect(address, getProvider(chainId));
}

function _isDexSupported(
  dex: string
): dex is keyof typeof ENABLED_ROUTES.spokePoolPeripheryAddresses {
  return spokePoolPeripheryDexes.includes(dex);
}
