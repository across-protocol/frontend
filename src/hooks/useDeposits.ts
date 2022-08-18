import axios from "axios";
import { useQuery } from "react-query";
import { rewardsApiUrl, depositsQueryKey } from "utils";

export type DepositStatus = "pending" | "filled";

export type Deposit = {
  depositId: number;
  depositTime: number;
  status: DepositStatus;
  filled: string;
  sourceChainId: number;
  destinationChainId: number;
  assetAddr: string;
  amount: string;
  depositTxHash: string;
  fillTxs: string[];
};

type Pagination = {
  total: number;
  limit: number;
  offset: number;
};

type GetDepositsResponse = {
  pagination: Pagination;
  deposits: Deposit[];
};

export function useDeposits(
  status: DepositStatus,
  limit: number,
  offset: number = 0
) {
  const queryKey = depositsQueryKey(status, limit, offset);

  const { data, ...other } = useQuery(
    queryKey,
    async () => {
      return getDeposits(status, limit, offset);
    },
    { keepPreviousData: true }
  );

  return {
    deposits: data ? data.data.deposits : [],
    pagination: data?.data.pagination,
    ...other,
  };
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
  return axios.get<GetDepositsResponse>(
    `${rewardsApiUrl}/deposits?status=${status}&limit=${limit}&offset=${offset}`
  );
}
