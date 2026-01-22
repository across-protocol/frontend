import { Address, parseAbi, zeroAddress, encodeFunctionData } from "viem";
import { MemoryClient } from "tevm";

import { handleTevmError } from "./tevm";

export async function getBalance(
  client: MemoryClient,
  tokenAddress: Address,
  accountAddress: Address
) {
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
  client: MemoryClient;
}) {
  const { client, tokenAddress, spender, amount, from } = params;
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
