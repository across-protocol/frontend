import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";

import {
  getChainInfo,
  NoFundsDepositedLogError,
  TransactionNotFoundError,
  TransactionFailedError,
  debug,
  getEcosystem,
} from "utils";
import { FromBridgeAndSwapPagePayload } from "utils/local-deposits";
import { createChainStrategies } from "utils/deposit-strategies";
import { BridgeProvider } from "./useDepositTracking/types";
import { DepositStatus } from "../types";
import { DepositData } from "./useDepositTracking/types";
import { useConnectionSVM } from "hooks/useConnectionSVM";
import { useConnectionEVM } from "hooks/useConnectionEVM";
import { makeUseUserTokenBalancesQueryKey } from "hooks/useUserTokenBalances";
import { useTrackTransferDepositCompleted } from "./useTrackTransferDepositCompleted";
import { useTrackTransferFillCompleted } from "./useTrackTransferFillCompleted";

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
  const [shouldRetryDepositQuery, setShouldRetryDepositQuery] = useState(true);

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
      try {
        // Use the strategy to get deposit information through the normalized interface
        return depositStrategy.getDeposit(depositTxHash, bridgeProvider);
      } catch (e) {
        // Don't retry if the deposit doesn't exist or is invalid
        if (
          e instanceof NoFundsDepositedLogError ||
          e instanceof TransactionNotFoundError ||
          e instanceof TransactionFailedError
        ) {
          setShouldRetryDepositQuery(false);
        }
        throw e;
      }
    },
    staleTime: Infinity,
    enabled: shouldRetryDepositQuery,
    retryDelay: getRetryDelay(fromChainId),
  });

  // Track deposit completion in Amplitude
  useEffect(() => {
    const depositInfo = depositQuery.data;

    // Wait for a successful deposit (or a revert)
    if (!depositInfo || depositInfo.status === "depositing") {
      return;
    }

    const succeeded = depositInfo.status === "deposited";
    const depositCompleteTimestamp = depositInfo.depositTimestamp || Date.now();

    trackTransferDepositCompleted({
      transactionHash: depositInfo.depositTxHash,
      succeeded,
      depositCompleteTimestamp,
    });
  }, [depositQuery.data, trackTransferDepositCompleted]);

  // Query for fill information
  const fillQuery = useQuery({
    queryKey: [
      "fill-by-deposit-tx-hash",
      depositTxHash,
      fromChainId,
      toChainId,
    ],
    queryFn: async () => {
      const depositInfo = depositQuery.data;

      if (depositInfo?.status !== "deposited") {
        return;
      }
      logRelayData(depositInfo.depositLog);
      // Use the strategy to get fill information through the normalized interface
      return await fillStrategy.getFill(depositInfo, bridgeProvider);
    },
    staleTime: Infinity,
    retry: true,
    retryDelay: getRetryDelay(toChainId),
    enabled: !!depositQuery.data && depositQuery.data.status === "deposited",
  });

  useEffect(() => {
    const fillInfo = fillQuery.data;

    if (!fillInfo || fillInfo.status === "filling") {
      return;
    }

    // Track fill completion
    const succeeded = fillInfo.status === "filled";
    const fillCompleteTimestamp = fillInfo.fillTxTimestamp || Date.now();
    const depositCompleteTimestamp =
      fillInfo.depositInfo.depositTimestamp || Date.now();

    trackTransferFillCompleted({
      fillTxHash: fillInfo.fillTxHash,
      succeeded,
      fillCompleteTimestamp,
      depositCompleteTimestamp,
      fillAmount: fillInfo.outputAmount?.toString() ?? "0",
      totalFilledAmount: fillInfo.outputAmount?.toString() ?? "0",
    });

    // Refetch user balances
    queryClient.refetchQueries({
      queryKey: makeUseUserTokenBalancesQueryKey(),
      type: "all", // Refetch both active and inactive queries
    });
  }, [fillQuery.data, queryClient, trackTransferFillCompleted]);

  const depositStatus = depositQuery.data?.status;

  const status: DepositStatus = (() => {
    if (depositStatus === "depositing") {
      return "depositing";
    } else if (depositStatus === "deposit-reverted") {
      return "deposit-reverted";
    } else if (depositStatus === "deposited") {
      if (fillQuery.data?.fillTxTimestamp) {
        return "filled";
      } else {
        return "filling";
      }
    } else {
      return "depositing";
    }
  })();

  return {
    depositQuery,
    fillQuery,
    status,
  };
}

function getRetryDelay(chainId: number) {
  const pollingInterval = getChainInfo(chainId).pollingInterval || 1_000;
  return Math.floor(pollingInterval / 3);
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
