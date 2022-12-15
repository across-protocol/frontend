import axios from "axios";
import { useQuery } from "react-query";
import { rewardsApiUrl, depositsQueryKey } from "utils";

export type DepositStatus = "pending" | "filled";

export type SpeedUpDepositTx = {
  hash: string;
  blockNumber: number;
  newRelayerFeePct: string;
  depositSourceChainId: number;
};

export type Deposit = {
  depositId: number;
  depositTime: number;
  status: DepositStatus;
  filled: string;
  sourceChainId: number;
  destinationChainId: number;
  assetAddr: string;
  depositorAddr: string;
  amount: string;
  depositTxHash: string;
  fillTxs: string[];
  speedUps: SpeedUpDepositTx[];
  depositRelayerFeePct: string;
  initialRelayerFeePct: string;
  suggestedRelayerFeePct: string;
};

export type Pagination = {
  total: number;
  limit: number;
  offset: number;
};

export type GetDepositsResponse = {
  pagination: Pagination;
  deposits: Deposit[];
};

export function useDeposits(
  status: DepositStatus,
  limit: number,
  offset: number = 0
) {
  return useQuery(
    depositsQueryKey(status, limit, offset),
    () => getDeposits(status, limit, offset),
    { keepPreviousData: true, refetchInterval: 15_000 }
  );
}

/**
 * @param status Deposit status to query, one of 'filled', 'pending'.
 * @returns A promise resolving to the deposits data in the scraper database.
 */
async function getDeposits(
  status: DepositStatus,
  limit: number,
  offset: number
) {
  const { data } = await axios.get<GetDepositsResponse>(
    `${rewardsApiUrl}/deposits?status=${status}&limit=${limit}&offset=${offset}`
  );
  return data;
}
