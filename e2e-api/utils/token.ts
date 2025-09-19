import { Address, parseAbi, zeroAddress, encodeFunctionData } from "viem";

import { e2eConfig } from "./config";
import { handleTevmError } from "./tevm";

export async function getBalance(
  chainId: number,
  tokenAddress: Address,
  accountAddress: Address
) {
  const client = e2eConfig.getClient(chainId);
  if (zeroAddress === tokenAddress) {
    return client.getBalance({
      address: accountAddress,
    });
  }
  const result = await client.readContract({
    address: tokenAddress,
    abi: parseAbi(["function balanceOf(address) view returns (uint256)"]),
    functionName: "balanceOf",
    args: [accountAddress],
  });
  return result;
}

export async function setAllowance(params: {
  chainId: number;
  tokenAddress: Address;
  account: Address;
  spender: Address;
  amount: bigint;
  from: Address;
}) {
  const { chainId, tokenAddress, spender, amount, from } = params;
  const client = e2eConfig.getClient(chainId);
  await client.tevmCall({
    from,
    to: tokenAddress,
    data: encodeFunctionData({
      abi: parseAbi(["function approve(address,uint256) returns (bool)"]),
      functionName: "approve",
      args: [spender, amount],
    }),
    addToBlockchain: true,
    onAfterMessage: handleTevmError,
  });
  await client.tevmMine({ blockCount: 1 });
}
