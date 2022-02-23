import { ethers } from "ethers";
import assert from "assert";

export function isValidString(s: string | null | undefined | ""): s is string {
  if (s != null && typeof s === "string" && s !== "") {
    return true;
  }
  return false;
}
export function shortenAddress(address: string): string {
  if (!isValidString(address)) {
    return "";
  }
  return `${address.substr(0, 4)}...${address.substr(-4)}`;
}

export function shortenAddressLong(address: string): string {
  if (!isValidString(address)) {
    return "";
  }
  return `${address.substr(0, 10)}...${address.substr(-10)}`;
}

// this actually will round up in some cases
export const numberFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 4,
}).format;

export function formatUnits(
  wei: ethers.BigNumberish,
  decimals: number
): string {
  return numberFormatter(Number(ethers.utils.formatUnits(wei, decimals)));
}

export function formatEther(wei: ethers.BigNumberish): string {
  return formatUnits(wei, 18);
}

export function formatEtherRaw(wei: ethers.BigNumberish): string {
  return ethers.utils.formatUnits(wei, 18);
}

export function parseUnits(value: string, decimals: number): ethers.BigNumber {
  return ethers.utils.parseUnits(value, decimals);
}

export function parseEther(value: string): ethers.BigNumber {
  return parseUnits(value, 18);
}

export function stringToHex(value: string) {
  return ethers.utils.hexlify(ethers.utils.toUtf8Bytes(value));
}

// appends hex tag to data
export function tagHex(dataHex: string, tagHex: string) {
  assert(ethers.utils.isHexString(dataHex), "Data must be valid hex string");
  return ethers.utils.hexConcat([dataHex, tagHex]);
}

// converts a string tag to hex and appends, currently not in use
export function tagString(dataHex: string, tagString: string) {
  return tagHex(dataHex, stringToHex(tagString));
}

// tags only an address
export function tagAddress(dataHex: string, address: string) {
  assert(ethers.utils.isAddress(address), "Data must be a valid address");
  return tagHex(dataHex, address);
}
