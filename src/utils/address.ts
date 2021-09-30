import { ethers } from "ethers";

export function isValidAddress(address: string) {
  return ethers.utils.isAddress(address);
}
