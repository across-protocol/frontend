import { ethers } from "ethers";

export function isValidAddress(address: string) {
  return ethers.utils.isAddress(address);
}

export function getAddress(address: string) {
  return ethers.utils.getAddress(address);
}

const defaultProvider = ethers.getDefaultProvider();
export const noContractCode = "0x";
export async function getCode(address: string) {
  return await defaultProvider.getCode(address);
}
