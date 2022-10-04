import { utils } from "ethers";

export function isValidAddress(address: string) {
  return utils.isAddress(address);
}

export function getAddress(address: string) {
  return utils.getAddress(address);
}
