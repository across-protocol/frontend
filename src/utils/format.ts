import { ethers } from "ethers";

export function shortenAddress(address: string): string {
  if (!address) return "";
  return `${address.substr(0, 4)}...${address.substr(-4)}`;
}

const numberFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
}).format;
export function formatUnits(
  wei: ethers.BigNumberish,
  decimals: number
): string {
  return numberFormatter(
    Number(ethers.utils.formatUnits(wei, decimals))
  ).replaceAll(",", "");
}

export function formatEther(wei: ethers.BigNumberish): string {
  return formatUnits(wei, 18);
}
