import { ethers } from "ethers";

export function isValidAddress(address: string) {
  return ethers.utils.isAddress(address);
}

export function getAddress(address: string) {
  return ethers.utils.getAddress(address);
}
