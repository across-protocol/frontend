import axios from "axios";
import { useQuery } from "react-query";
import { rewardsApiUrl, userDepositsQueryKey } from "utils";

import { DepositStatus, GetDepositsResponse } from "./useDeposits";
import { useLocalPendingDeposits } from "./useLocalPendingDeposits";

export function useUserDeposits(
  status: DepositStatus,
  limit: number,
  offset: number = 0,
  userAddress?: string
) {
  const { getLocalPendingDeposits, removeLocalPendingDeposits } =
    useLocalPendingDeposits();

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

      // To provide a better UX, we take optimistically updated local pending deposits
      // into account to show on the "My Transactions" page.
      const localPendingUserDeposits = getLocalPendingDeposits().filter(
        (deposit) => deposit.depositorAddr === userAddress
      );
      const { deposits, pagination } = await getUserDeposits(
        userAddress,
        status,
        limit,
        offset
      );
      const indexedDepositTxHashes = new Set(
        deposits.map((d) => d.depositTxHash)
      );

      // If the Scraper API indexed the optimistically added pending deposit,
      // then we need to remove it from local storage.
      const indexedLocalPendingDeposits = localPendingUserDeposits.filter(
        (localPendingDeposit) =>
          indexedDepositTxHashes.has(localPendingDeposit.depositTxHash)
      );
      removeLocalPendingDeposits(
        indexedLocalPendingDeposits.map((deposit) => deposit.depositTxHash)
      );

      // If the Scraper API is still a few blocks behind and didn't index
      // the optimistically added deposits, then we merge them to provide instant
      // visibility of a deposit after a user performed a transaction.
      const notIndexedLocalPendingDeposits = localPendingUserDeposits.filter(
        (localPendingDeposit) =>
          !indexedDepositTxHashes.has(localPendingDeposit.depositTxHash)
      );
      const mergedDeposits =
        status === "pending"
          ? [...notIndexedLocalPendingDeposits, ...deposits]
          : deposits;

      return {
        deposits: mergedDeposits,
        pagination,
      };
    },
    {
      keepPreviousData: true,
      refetchInterval: 15_000,
      enabled: Boolean(userAddress),
    }
  );
}

async function getUserDeposits(
  userAddress: string,
  status: DepositStatus,
  limit: number,
  offset: number
) {
  const { data } = await axios.get<GetDepositsResponse>(
    `${rewardsApiUrl}/deposits/${userAddress}?status=${status}&limit=${limit}&offset=${offset}`
  );
  return data;
}
