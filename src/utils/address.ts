import { utils } from "ethers";

import { ChainId } from "./constants";
import { getProvider } from "./providers";

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
