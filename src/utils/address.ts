import { utils } from "ethers";

import { ChainId } from "./constants";
import { getProvider, getSVMRpc } from "./providers";
import { address as solanaAddress } from "@solana/kit";
import { chainIsSvm } from "./sdk";

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

export async function isProgram(address: string, chainId: ChainId) {
  if (!chainIsSvm(chainId)) {
    throw new Error(`Chain ${chainId} is not an SVM chain`);
  }
  const rpc = getSVMRpc(chainId);
  const addr = solanaAddress(address);
  const { value: accountInfo } = await rpc.getAccountInfo(addr).send();

  if (!accountInfo) {
    throw new Error(`Account ${address} does not exist on chain ${chainId}`);
  }

  return accountInfo.executable;
}
