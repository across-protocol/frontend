import { Address, parseAbi, zeroAddress, PrivateKeyAccount } from "viem";

import { e2eConfig } from "./config";

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
  wallet: PrivateKeyAccount;
}) {
  const { chainId, tokenAddress, spender, amount, wallet } = params;
  const client = e2eConfig.getClient(chainId);
  const txHash = await client.writeContract({
    address: tokenAddress,
    abi: parseAbi(["function approve(address,uint256) returns (bool)"]),
    functionName: "approve",
    args: [spender, amount],
    account: wallet,
  });
  const receipt = await client.waitForTransactionReceipt({
    hash: txHash,
  });
  return receipt;
}
