import { utils } from "ethers";

import { ChainId, TOKEN_SYMBOLS_MAP } from "./constants";
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

export function isWeth(address: string): boolean {
  return Object.values(TOKEN_SYMBOLS_MAP.WETH.addresses).includes(address);
}

export function getWethAddressForChain(chainId: ChainId): string {
  return TOKEN_SYMBOLS_MAP.WETH.addresses[chainId];
}

// TODO: Move these addresses to a .json file.
export function getMulticallHandlerAddress(chainId: ChainId): string {
  const create2Deployment = "0x924a9f036260DdD5808007E1AA95f08eD08aA569";
  switch (chainId) {
    case ChainId.MAINNET:
      return create2Deployment;
    case ChainId.OPTIMISM:
      return create2Deployment;
    case ChainId.POLYGON:
      return create2Deployment;
    case ChainId.ZK_SYNC:
      return "0x863859ef502F0Ee9676626ED5B418037252eFeb2";
    case ChainId.WORLD_CHAIN:
      return create2Deployment;
    case ChainId.REDSTONE:
      return create2Deployment;
    case ChainId.LISK:
      return create2Deployment;
    case ChainId.BASE:
      return create2Deployment;
    case ChainId.MODE:
      return create2Deployment;
    case ChainId.ARBITRUM:
      return create2Deployment;
    case ChainId.BLAST:
      return create2Deployment;
    case ChainId.LINEA:
      return "0x1015c58894961F4F7Dd7D68ba033e28Ed3ee1cDB";
    case ChainId.SCROLL:
      return create2Deployment;
    case ChainId.ZORA:
      return create2Deployment;
    default:
      throw new Error(`Multicall handler not deployed to ${chainId}`);
  }
}
