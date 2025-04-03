import { ERC20__factory } from "@across-protocol/contracts";
import { BigNumber, constants } from "ethers";

import { callViaMulticall3, getProvider } from "./_utils";

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

export async function getBalanceAndAllowance(params: {
  chainId: number;
  tokenAddress: string;
  owner: string;
  spender: string;
}): Promise<{ balance: BigNumber; allowance: BigNumber }> {
  const provider = getProvider(params.chainId);

  if (params.tokenAddress === constants.AddressZero) {
    const balance = await provider.getBalance(params.owner);
    return { balance, allowance: constants.MaxUint256 };
  }

  const erc20 = getErc20(params);
  const [balance, allowance] = await callViaMulticall3(provider, [
    {
      contract: erc20,
      functionName: "balanceOf",
      args: [params.owner],
    },
    {
      contract: erc20,
      functionName: "allowance",
      args: [params.owner, params.spender],
    },
  ]);
  return { balance: balance[0], allowance: allowance[0] };
}

export function getErc20(params: { chainId: number; tokenAddress: string }) {
  const provider = getProvider(params.chainId);
  return ERC20__factory.connect(params.tokenAddress, provider);
}
