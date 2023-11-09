import axios from "axios";
import { useQuery } from "react-query";

import {
  rewardsApiUrl,
  depositsQueryKey,
  userDepositsQueryKey,
  defaultRefetchInterval,
} from "utils";
import { getLocalDeposits, removeLocalDeposits } from "../utils/local-deposits";

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
  recipientAddr: string;
  message: string;
  amount: string;
  depositTxHash: string;
  fillTxs: string[];
  speedUps: SpeedUpDepositTx[];
  depositRelayerFeePct: string;
  initialRelayerFeePct?: string;
  suggestedRelayerFeePct?: string;
  fillTime?: number;
  rewards?: {
    type: "referrals" | "op-rebates";
    rate: number;
    amount: string;
    usd: string;
  };
  feeBreakdown?: {
    bridgeFee: {
      pct: string;
      usd: string;
    };
    destinationGasFee: {
      pct: string;
      usd: string;
    };
  };
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
    () => getDeposits({ status, limit, offset }),
    { keepPreviousData: true, refetchInterval: defaultRefetchInterval }
  );
}

export function useUserDeposits(
  status: DepositStatus,
  limit: number,
  offset: number = 0,
  userAddress?: string
) {
  return useQuery(
    userDepositsQueryKey(userAddress!, status, limit, offset),
    async () => {
      if (!userAddress) {
        return {
          deposits: [],
          pagination: {
            total: 0,
            limit: 0,
            offset: 0,
          },
        };
      }

      // To provide a better UX, we take optimistically updated local deposits
      // into account to show on the "My Transactions" page.
      const localUserDeposits = getLocalDeposits().filter(
        (deposit) =>
          deposit.status === status &&
          (deposit.depositorAddr === userAddress ||
            deposit.recipientAddr === userAddress)
      );
      const { deposits, pagination } = await getDeposits({
        address: userAddress,
        status,
        limit,
        offset,
      });
      const indexedDepositTxHashes = new Set(
        deposits.map((d) => d.depositTxHash)
      );

      // If the Scraper API indexed the optimistically added deposit,
      // then we need to remove it from local storage.
      const indexedLocalDeposits = localUserDeposits.filter(
        (localPendingDeposit) =>
          indexedDepositTxHashes.has(localPendingDeposit.depositTxHash)
      );
      removeLocalDeposits(
        indexedLocalDeposits.map((deposit) => deposit.depositTxHash)
      );

      // If the Scraper API is still a few blocks behind and didn't index
      // the optimistically added deposits, then we merge them to provide instant
      // visibility of a deposit after a user performed a transaction.
      const notIndexedLocalDeposits = localUserDeposits.filter(
        (localPendingDeposit) =>
          !indexedDepositTxHashes.has(localPendingDeposit.depositTxHash)
      );
      const mergedDeposits = [...notIndexedLocalDeposits, ...deposits];

      return {
        deposits: mergedDeposits,
        pagination,
      };
    },
    {
      keepPreviousData: true,
      refetchInterval: defaultRefetchInterval,
      enabled: Boolean(userAddress),
    }
  );
}

async function getDeposits(
  params: Partial<{
    address: string;
    status: DepositStatus;
    limit: number;
    offset: number;
  }>
) {
  const { data } = await axios.get<GetDepositsResponse>(
    `${rewardsApiUrl}/deposits`,
    { params }
  );
  return data;
}
