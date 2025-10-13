import { Address, parseAbi, zeroAddress, encodeFunctionData } from "viem";

import { E2EConfig } from "./config";
import { handleTevmError } from "./tevm";

export async function getBalance(
  tokenAddress: Address,
  accountAddress: Address,
  client: ReturnType<E2EConfig["getClient"]>
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
  tokenAddress: Address;
  account: Address;
  spender: Address;
  amount: bigint;
  from: Address;
  client: ReturnType<E2EConfig["getClient"]>;
}) {
  const { tokenAddress, spender, amount, from, client } = params;
  const approvalCallResult = await client.tevmCall({
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
  await client.tevmMine({ blockCount: 5 });

  if (!approvalCallResult.txHash) {
    throw new Error("Approval call failed to produce a transaction hash");
  }

  await client.waitForTransactionReceipt({
    hash: approvalCallResult.txHash,
  });
}
