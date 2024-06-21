import axios from "axios";
import { useQuery } from "react-query";

import {
  rewardsApiUrl,
  depositsQueryKey,
  userDepositsQueryKey,
  defaultRefetchInterval,
} from "utils";
import {
  getLocalDepositEntries,
  removeLocalDeposits,
} from "../utils/local-deposits";
import { DepositStatusFilter } from "views/Transactions/types";

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
  fillDeadline?: string;
  rewards?:
    | {
        type: "op-rebates" | "arb-rebates";
        rate: number;
        amount: string;
        usd: string;
      }
    | {
        type: "referrals";
        rate: number;
        tier: number;
        amount: string;
        usd: string;
      };
  feeBreakdown?: {
    // lp fee
    lpFeeUsd: string;
    lpFeePct: string; // wei pct
    lpFeeAmount: string;
    // relayer fee
    relayCapitalFeeUsd: string;
    relayCapitalFeePct: string; // wei pct
    relayCapitalFeeAmount: string;
    relayGasFeeUsd: string;
    relayGasFeePct: string; // wei pct
    relayGasFeeAmount: string;
    // total = lp fee + relayer fee
    totalBridgeFeeUsd: string;
    totalBridgeFeePct: string; // wei pct
    totalBridgeFeeAmount: string;
    // swap fee
    swapFeeUsd?: string;
    swapFeePct?: string; // wei pct
    swapFeeAmount?: string;
  };
  token?: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  outputToken?: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  swapToken?: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  swapTokenAmount?: string;
  swapTokenAddress?: string;
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
  status: DepositStatusFilter,
  limit: number,
  offset: number = 0
) {
  return useQuery(
    depositsQueryKey(status, limit, offset),
    () => {
      return getDeposits({
        status: status === "all" ? undefined : status,
        limit,
        offset,
        skipOldUnprofitable: true,
      });
    },
    { keepPreviousData: true, refetchInterval: defaultRefetchInterval }
  );
}

export function useUserDeposits(
  status: DepositStatusFilter,
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

      const omitStatusFilter = status === "all";

      // To provide a better UX, we take optimistically updated local deposits
      // into account to show on the "My Transactions" page.
      const localUserDeposits = getLocalDepositEntries()
        .filter(({ deposit }) =>
          omitStatusFilter
            ? true
            : deposit.status === status &&
              (deposit.depositorAddr === userAddress ||
                deposit.recipientAddr === userAddress)
        )
        .map(({ deposit }) => deposit);
      const { deposits, pagination } = await getDeposits({
        address: userAddress,
        status: omitStatusFilter ? undefined : status,
        limit,
        offset,
      });
      const indexedDepositTxHashes = new Set(
        deposits.map((d) => d.depositTxHash)
      );

      // If the Scraper API is still a few blocks behind and didn't index
      // the optimistically added deposits, then we merge them to provide instant
      // visibility of a deposit after a user performed a transaction.
      // - If the local deposit is pending, we show it if it's not indexed yet.
      // - If the local deposit is filled, we only show it if the indexed deposit is pending.
      const localDepositsToShow = localUserDeposits.filter(
        (localUserDeposit) => {
          if (localUserDeposit.status === "pending") {
            return !indexedDepositTxHashes.has(localUserDeposit.depositTxHash);
          } else if (localUserDeposit.status === "filled") {
            const indexedDeposit = deposits.find(
              (d) => d.depositTxHash === localUserDeposit.depositTxHash
            );
            return indexedDeposit ? indexedDeposit.status === "pending" : true;
          }
        }
      );
      const localDepositsToShowTxHashes = new Set(
        localDepositsToShow.map((d) => d.depositTxHash)
      );
      const indexedDepositsToShow = deposits.filter(
        (deposit) => !localDepositsToShowTxHashes.has(deposit.depositTxHash)
      );
      const mergedDeposits = [...localDepositsToShow, ...indexedDepositsToShow];

      // Remove local deposits that are in sync with the Scraper
      const localUserDepositsToRemove = localUserDeposits
        .filter(
          (deposit) => !localDepositsToShowTxHashes.has(deposit.depositTxHash)
        )
        .map((d) => d.depositTxHash);
      removeLocalDeposits(localUserDepositsToRemove);

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
    skipOldUnprofitable: boolean;
    address: string;
    status: DepositStatus;
    limit: number;
    offset: number;
  }> = {}
) {
  const { data } = await axios.get<GetDepositsResponse>(
    `${rewardsApiUrl}/deposits/tx-page`,
    {
      params: {
        status: params.status,
        skipOldUnprofitable: params.skipOldUnprofitable,
        limit: params.limit,
        offset: params.offset,
        depositorOrRecipientAddress: params.address,
        orderBy: "status",
        include: ["token"],
      },
    }
  );
  return data;
}
