import { ERC20__factory } from "@across-protocol/contracts";
import { getProvider } from "./_utils";

export async function getAllowance(params: {
  chainId: number;
  tokenAddress: string;
  owner: string;
  spender: string;
}) {
  const erc20 = getErc20(params);
  return erc20.allowance(params.owner, params.spender);
}

export async function getBalance(params: {
  chainId: number;
  tokenAddress: string;
  owner: string;
}) {
  const erc20 = getErc20(params);
  return erc20.balanceOf(params.owner);
}

export function getErc20(params: { chainId: number; tokenAddress: string }) {
  const provider = getProvider(params.chainId);
  return ERC20__factory.connect(params.tokenAddress, provider);
}
