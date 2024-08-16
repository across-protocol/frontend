import { utils } from "ethers";

import { ChainId, TOKEN_SYMBOLS_MAP } from "./constants";
import { getProvider } from "./providers";
import { getDeployedAddress } from "@across-protocol/contracts";

export function isValidAddress(address: string) {
  return utils.isAddress(address);
}

export function getAddress(address: string) {
  return utils.getAddress(address);
}

export const noContractCode = "0x";
export async function getCode(address: string, chainId: ChainId) {
  const provider = getProvider(chainId);
  return await provider.getCode(address);
}

export function isWeth(address: string): boolean {
  return Object.values(TOKEN_SYMBOLS_MAP.WETH.addresses).includes(address);
}

export function getWethAddressForChain(chainId: ChainId): string {
  return TOKEN_SYMBOLS_MAP.WETH.addresses[chainId];
}

export function getMulticallHandlerAddress(chainId: ChainId): string {
  const maybeAddress = getDeployedAddress("MulticallHandler", chainId);
  if (!maybeAddress) {
    throw new Error(
      `AddressUtils: No spoke pool verifier address for chain ${chainId}`
    );
  }
  return maybeAddress;
}
