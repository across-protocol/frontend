import { useQueries } from "@tanstack/react-query";
import axios from "axios";
import { BigNumber } from "ethers";
import { indexerApiBaseUrl, isDefined } from "utils";

/**
 * A hook used to track the statuses of multiple deposits via the indexer API
 * @param deposits Array of deposit objects containing `originChainId` and `depositId`
 */
export function useIndexerDepositsTracking(
  deposits: {
    originChainId?: number;
    depositId?: number;
  }[]
) {
  const queries = useQueries({
    queries: deposits.map((deposit) => ({
      queryKey: [
        "indexer_deposit_tracking",
        deposit.originChainId,
        deposit.depositId,
      ] as [string, number, number],
      enabled:
        isDefined(deposit.originChainId) &&
        isDefined(deposit.depositId) &&
        isDefined(indexerApiBaseUrl),
      queryFn: async (): Promise<BigNumber | undefined> => {
        try {
          const response = await axios.get(
            `${indexerApiBaseUrl}/deposit/status`,
            {
              params: {
                originChainId: deposit.originChainId,
                depositId: deposit.depositId,
              },
            }
          );
          return response.data;
        } catch (e) {
          // FIXME: for now we ignore since this is for load testing purposes
        }
      },
      refetchInterval: 5_000, // 5 seconds
    })),
  });

  return queries.map((query) => ({
    depositStatus: query.data ?? undefined,
    ...query,
  }));
}

/**
 * A hook used to track a single deposit status via the indexer API
 * @param originChainId The chain ID of the deposit's origin
 * @param depositId The deposit ID
 */
export function useIndexerDepositTracking(
  originChainId?: number,
  depositId?: number
) {
  const [singleDeposit] = useIndexerDepositsTracking(
    isDefined(originChainId) && isDefined(depositId)
      ? [{ originChainId, depositId }]
      : []
  );

  return (
    singleDeposit ?? {
      depositStatus: undefined,
      isLoading: false,
      isError: false,
    }
  );
}
