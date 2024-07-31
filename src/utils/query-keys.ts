import { ethers } from "ethers";
import { ChainId, rewardProgramTypes } from "./constants";
import { DepositStatusFilter } from "views/Transactions/types";

/**
 * Generates query keys for @tanstack/react-query `useQuery` hook, used in the `useLatestBlock` hook.
 * @param chainId The chain Id of the chain to poll for new blocks.
 * @returns An array of query keys for @tanstack/react-query `useQuery` hook.
 */
export function latestBlockQueryKey(chainId: ChainId) {
  return ["block", chainId];
}

/**
 * Generates query keys for @tanstack/react-query `useQuery` hook, used in the `useBalance` hook.
 * @param chainId  The chain Id of the chain to execute the query on.
 * @param token  The token to fetch the balance of.
 * @param account  The account to query the balance of.
 * @returns An array of query keys for @tanstack/react-query `useQuery` hook.
 */
export function balanceQueryKey(
  account?: string,
  chainId?: ChainId,
  token?: string
) {
  return ["balance", chainId, token, account] as const;
}

/**
 * @param tokenSymbol  The token symbol to check bridge fees for.
 * @param amount  The amount to check bridge fees for.
 * @param fromChainId The origin chain of this bridge action
 * @param toChainId The destination chain of this bridge action
 * @returns An array of query keys for @tanstack/react-query `useQuery` hook.
 */
export function bridgeFeesQueryKey(
  amount: ethers.BigNumber,
  inputToken: string,
  outputToken: string,
  fromChainId: ChainId,
  toChainId: ChainId
) {
  return [
    "bridgeFees",
    inputToken,
    outputToken,
    amount.toString(),
    fromChainId,
    toChainId,
  ] as const;
}

export function bridgeLimitsQueryKey(
  inputToken?: string,
  outputToken?: string,
  fromChainId?: ChainId,
  toChainId?: ChainId
) {
  return ["bridgeLimits", inputToken, outputToken, fromChainId, toChainId];
}

/**
 * Generates query keys for @tanstack/react-query `useQuery` hook, used in the `useRewards` hook.
 * @param program  The reward program that rewards are being queried for.
 * @param account  The address that rewards are being queried for.
 * @param limit The limit on the number of results that are returned (page size).
 * @param offset The number of elements to omit before returning results.
 * @returns An array of query keys for @tanstack/react-query `useQuery` hook.
 */
export function rewardsQueryKey(
  program: rewardProgramTypes,
  account?: string,
  limit?: number,
  offset?: number
) {
  return ["rewards", program, account, limit, offset] as const;
}

/**
 * Generates query keys for @tanstack/react-query `useQuery` hook, used in the `useRewardSummary` hook.
 * @param program  The reward program that reward summary is being queried for.
 * @param account  The address that reward summary is being queried for.
 * @returns An array of query keys for @tanstack/react-query `useQuery` hook.
 */
export function rewardSummaryQueryKey(
  program: rewardProgramTypes,
  account?: string
) {
  return ["rewardSummary", program, account] as const;
}

export function depositsQueryKey(
  status: DepositStatusFilter,
  limit: number,
  offset: number
) {
  return ["deposits", status, limit, offset];
}

export function userDepositsQueryKey(
  userAddress: string,
  status: DepositStatusFilter,
  limit: number,
  offset: number
) {
  return ["deposits", "user", userAddress, status, limit, offset];
}

export function prelaunchDataQueryKey(address?: string, jwt?: string) {
  return ["prelaunch-data", address, jwt];
}

export function prelaunchUserDetailsQueryKey(jwt: string) {
  return ["prelaunch-data-discord-details", jwt];
}

export function isAirdropClaimedQueryKey(
  account?: string,
  airdropWindowIndex?: number
) {
  return ["is-airdrop-claimed", account, airdropWindowIndex];
}

export function getUnclaimedProofsQueryKey(
  rewardsType: rewardProgramTypes,
  account?: string
) {
  return [rewardsType, "unclaimed", account];
}

export type SwapQuoteQueryKeyParams = {
  swapTokenSymbol?: string;
  acrossInputTokenSymbol: string;
  acrossOutputTokenSymbol: string;
  swapTokenAmount: string;
  originChainId: number;
  destinationChainId: number;
  swapSlippage: number;
};
export function swapQuoteQueryKey(params: SwapQuoteQueryKeyParams) {
  return ["swap-quote", params] as const;
}
