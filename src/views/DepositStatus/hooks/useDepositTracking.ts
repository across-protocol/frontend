import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

import {
  getChainInfo,
  NoFundsDepositedLogError,
  TransactionNotFoundError,
  TransactionFailedError,
  TransactionPendingError,
  debug,
  getEcosystem,
} from "utils";
import { FromBridgeAndSwapPagePayload } from "utils/local-deposits";
import { createChainStrategies } from "utils/deposit-strategies";
import {
  BridgeProvider,
  DepositInfo,
  FillInfo,
} from "./useDepositTracking/types";
import { DepositStatus } from "../types";
import { DepositData } from "./useDepositTracking/types";
import { useConnectionSVM } from "hooks/useConnectionSVM";
import { useConnectionEVM } from "hooks/useConnectionEVM";
import { makeUseUserTokenBalancesQueryKey } from "hooks/useUserTokenBalances";
import { useTrackTransferDepositCompleted } from "./useTrackTransferDepositCompleted";
import { useTrackTransferFillCompleted } from "./useTrackTransferFillCompleted";

const MAX_RETRIES = 3;

/**
 * Hook to track deposit and fill status across EVM and SVM chains
 * @param params Object containing:
 * - depositTxHash: Transaction hash or signature
 * - fromChainId: Origin chain ID
 * - toChainId: Destination chain ID
 * - fromBridgeAndSwapPagePayload: Optional bridge page payload
 * @returns Deposit and fill query results and status
 */
export function useDepositTracking({
  depositTxHash,
  fromChainId,
  toChainId,
  bridgeProvider = "across",
  fromBridgeAndSwapPagePayload,
}: {
  depositTxHash: string;
  fromChainId: number;
  toChainId: number;
  bridgeProvider?: BridgeProvider;
  fromBridgeAndSwapPagePayload?: FromBridgeAndSwapPagePayload;
}) {
  const queryClient = useQueryClient();
  const { account: accountEVM } = useConnectionEVM();
  const { account: accountSVM } = useConnectionSVM();
  const account =
    getEcosystem(fromChainId) === "evm" ? accountEVM : accountSVM?.toBase58();

  const { trackTransferDepositCompleted } = useTrackTransferDepositCompleted(
    fromBridgeAndSwapPagePayload
  );

  const { trackTransferFillCompleted } = useTrackTransferFillCompleted(
    fromBridgeAndSwapPagePayload
  );

  // Create appropriate strategy for the source chain
  const { depositStrategy, fillStrategy } = useMemo(
    () => createChainStrategies(fromChainId, toChainId),
    [fromChainId, toChainId]
  );

  // Query for deposit information
  const depositQuery = useQuery({
    queryKey: ["deposit", bridgeProvider, depositTxHash, fromChainId, account],
    queryFn: async () => {
      return await depositStrategy.getDeposit(depositTxHash, bridgeProvider);
    },
    staleTime: Infinity,
    retryDelay: getRetryDelay(fromChainId),
    retry: (failureCount, error) => {
      if (error instanceof TransactionPendingError) {
        return true;
      }
      if (error instanceof TransactionNotFoundError) {
        return failureCount < MAX_RETRIES;
      }
      return false;
    },
  });

  // Infer deposit state from query data and error
  const deposit = useMemo((): DepositInfo | undefined => {
    if (depositQuery.data) {
      return depositQuery.data;
    }

    const error = depositQuery.error;

    if (!error || error instanceof TransactionPendingError) {
      return {
        depositTxHash: undefined,
        depositTimestamp: undefined,
        status: "depositing",
        depositLog: undefined,
      };
    }

    if (error instanceof TransactionFailedError) {
      return {
        depositTxHash,
        depositTimestamp: undefined,
        status: "deposit-reverted",
        depositLog: undefined,
        error: error.error,
        formattedError: error.formattedError,
      };
    }

    if (error instanceof TransactionNotFoundError) {
      // retries exhausted
      if (depositQuery.isError) {
        return {
          depositTxHash,
          depositTimestamp: undefined,
          status: "deposit-reverted",
          depositLog: undefined,
          error: undefined,
          formattedError:
            "Transaction not found. It may have been dropped from the mempool.",
        };
      }
      // retrying...
      return {
        depositTxHash: undefined,
        depositTimestamp: undefined,
        status: "depositing",
        depositLog: undefined,
      };
    }

    if (error instanceof NoFundsDepositedLogError) {
      return {
        depositTxHash,
        depositTimestamp: undefined,
        status: "deposit-reverted",
        depositLog: undefined,
        error: undefined,
        formattedError: undefined,
      };
    }

    return undefined;
  }, [
    depositQuery.data,
    depositQuery.error,
    depositTxHash,
    depositQuery.isError,
  ]);

  // Track deposit completion in Amplitude
  useEffect(() => {
    // Wait for a successful deposit (or a revert)
    if (!deposit || deposit.status === "depositing") {
      return;
    }

    const succeeded = deposit.status === "deposited";
    const depositCompleteTimestamp = deposit.depositTimestamp || Date.now();

    trackTransferDepositCompleted({
      transactionHash: deposit.depositTxHash || depositTxHash,
      succeeded,
      depositCompleteTimestamp,
    });
  }, [deposit, depositTxHash, trackTransferDepositCompleted]);

  // Query for fill information
  const fillQuery = useQuery({
    queryKey: [
      "fill-by-deposit-tx-hash",
      depositTxHash,
      fromChainId,
      toChainId,
    ],
    queryFn: async () => {
      const depositData = depositQuery.data;
      if (!depositData) {
        throw new Error("Deposit data not available");
      }
      logRelayData(depositData.depositLog);
      return await fillStrategy.getFill(depositData, bridgeProvider);
    },
    staleTime: Infinity,
    retry: true,
    retryDelay: getRetryDelay(toChainId),
    enabled: !!depositQuery.data,
  });

  // Infer fill state from query data and error
  const fill = useMemo((): FillInfo | undefined => {
    const depositData = depositQuery.data;

    if (!depositData) {
      return undefined;
    }

    if (fillQuery.data) {
      return fillQuery.data;
    }

    // Still loading or retrying
    return {
      fillTxHash: undefined,
      fillTxTimestamp: undefined,
      depositInfo: depositData,
      status: "filling",
      outputAmount: undefined,
    };
  }, [fillQuery.data, depositQuery.data]);

  // Track fill completion in Amplitude
  useEffect(() => {
    if (!fill || fill.status === "filling") {
      return;
    }

    const succeeded = fill.status === "filled";
    const fillCompleteTimestamp = fill.fillTxTimestamp || Date.now();
    const depositCompleteTimestamp =
      fill.depositInfo.depositTimestamp || Date.now();

    trackTransferFillCompleted({
      fillTxHash: fill.fillTxHash,
      succeeded,
      fillCompleteTimestamp,
      depositCompleteTimestamp,
      fillAmount: fill.outputAmount?.toString() ?? "0",
      totalFilledAmount: fill.outputAmount?.toString() ?? "0",
    });

    // Refetch user balances
    queryClient.refetchQueries({
      queryKey: makeUseUserTokenBalancesQueryKey(),
      type: "all",
    });
  }, [fill, queryClient, trackTransferFillCompleted]);

  // Compute overall status from deposit and fill states
  const status: DepositStatus = (() => {
    if (!deposit || deposit.status === "depositing") {
      return "depositing";
    } else if (deposit.status === "deposit-reverted") {
      return "deposit-reverted";
    } else if (deposit.status === "deposited") {
      if (fill?.status === "filled") {
        return "filled";
      } else {
        return "filling";
      }
    }
    return "depositing";
  })();

  return {
    depositQuery,
    fillQuery,
    status,
    deposit,
    fill,
  };
}

function getRetryDelay(chainId: number) {
  const pollingInterval = getChainInfo(chainId).pollingInterval || 1_000;
  return Math.floor(pollingInterval / MAX_RETRIES);
}

// https://github.com/across-protocol/contracts/blob/master/scripts/svm/simpleFill.ts
function logRelayData(depositInfo: DepositData): void {
  if (debug) {
    console.debug("RelayData\n", {
      seed: 0,
      destinationChainId: depositInfo.destinationChainId,
      depositor: depositInfo.depositor.toBase58(),
      recipient: depositInfo.recipient.toBase58(),
      exclusiveRelayer: depositInfo.exclusiveRelayer.toBase58(),
      inputToken: depositInfo.inputToken.toBase58(),
      outputToken: depositInfo.outputToken.toBase58(),
      inputAmount: depositInfo.inputAmount.toString(),
      outputAmount: depositInfo.outputAmount.toString(),
      originChainId: depositInfo.originChainId,
      depositId: depositInfo.depositId.toString(),
      fillDeadline: depositInfo.fillDeadline,
      exclusivityDeadline: depositInfo.exclusivityDeadline,
    });
  }
}
