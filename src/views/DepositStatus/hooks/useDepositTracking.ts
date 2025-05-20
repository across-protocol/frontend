import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { BigNumber } from "ethers";

import { useAmplitude, useConnection } from "hooks";
import {
  generateDepositConfirmed,
  getToken,
  recordTransferUserProperties,
  wait,
  getChainInfo,
  NoFundsDepositedLogError,
} from "utils";
import {
  getLocalDepositByTxHash,
  addLocalDeposit,
  removeLocalDeposits,
} from "utils/local-deposits";
import { ampli } from "ampli";
import { createChainStrategies } from "utils/deposit-strategies";
import { FromBridgePagePayload } from "views/Bridge/hooks/useBridgeAction";
import { DepositStatus } from "../types";

/**
 * Hook to track deposit and fill status across EVM and SVM chains
 * @param params Object containing:
 * - depositTxHash: Transaction hash or signature
 * - fromChainId: Origin chain ID
 * - toChainId: Destination chain ID
 * - fromBridgePagePayload: Optional bridge page payload
 * @returns Deposit and fill query results and status
 */
export function useDepositTracking({
  depositTxHash,
  fromChainId,
  toChainId,
  fromBridgePagePayload,
}: {
  depositTxHash: string;
  fromChainId: number;
  toChainId: number;
  fromBridgePagePayload?: FromBridgePagePayload;
}) {
  const [shouldRetryDepositQuery, setShouldRetryDepositQuery] = useState(true);

  const { addToAmpliQueue } = useAmplitude();
  const { account } = useConnection();

  // Create appropriate strategy for the source chain
  const { depositStrategy, fillStrategy } = createChainStrategies(
    fromChainId,
    toChainId
  );

  // Query for deposit information
  const depositQuery = useQuery({
    queryKey: ["deposit", depositTxHash, fromChainId, account],
    queryFn: async () => {
      // On some L2s the tx is mined too fast for the animation to show, so we add a delay
      await wait(1_000);

      try {
        // Use the strategy to get deposit information through the normalized interface
        return depositStrategy.getDeposit(depositTxHash);
      } catch (e) {
        // Don't retry if the deposit doesn't exist or is invalid
        if (e instanceof NoFundsDepositedLogError) {
          setShouldRetryDepositQuery(false);
        }
        throw e;
      }
    },
    staleTime: Infinity,
    enabled: shouldRetryDepositQuery,
    retryDelay: getRetryDelay(fromChainId),
  });

  // Track deposit in Amplitude and add to local storage
  useEffect(() => {
    const depositInfo = depositQuery.data;

    if (
      !fromBridgePagePayload ||
      !depositInfo ||
      depositInfo.status === "depositing"
    ) {
      return;
    }

    // Check if deposit is already in local storage
    const localDepositByTxHash = getLocalDepositByTxHash(depositTxHash);

    if (!localDepositByTxHash) {
      // Optimistically add deposit to local storage for instant visibility
      // Use the strategy-specific conversion method
      const localDeposit = depositStrategy.convertForDepositQuery(
        depositInfo,
        fromBridgePagePayload
      );
      addLocalDeposit(localDeposit);
    }

    // Check if the deposit is from the current user
    const isFromCurrentUser = depositInfo.depositLog.depositor === account;
    if (!isFromCurrentUser) {
      return;
    }

    // Track deposit in Amplitude
    addToAmpliQueue(() => {
      ampli.transferDepositCompleted(
        generateDepositConfirmed(
          fromBridgePagePayload.quoteForAnalytics,
          fromBridgePagePayload.referrer,
          fromBridgePagePayload.timeSigned,
          depositInfo.depositTxHash,
          true,
          depositInfo.depositTimestamp,
          fromBridgePagePayload.selectedRoute.fromTokenAddress,
          fromBridgePagePayload.selectedRoute.toTokenAddress
        )
      );
    });
  }, [
    depositQuery.data,
    addToAmpliQueue,
    fromBridgePagePayload,
    account,
    depositTxHash,
    depositStrategy,
  ]);

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

      // Use the strategy to get fill information through the normalized interface
      return await fillStrategy.getFill(depositInfo as any, toChainId);
    },
    staleTime: Infinity,
    retry: true,
    refetchInterval: 10_000,
    retryDelay: getRetryDelay(toChainId),
    enabled: !!depositQuery.data && depositQuery.data.status !== "depositing",
  });

  // Track fill in local storage
  useEffect(() => {
    const fillInfo = fillQuery.data;

    if (!fromBridgePagePayload || !fillInfo || fillInfo.status === "filling") {
      return;
    }
    // Remove existing deposit and add updated one with fill information
    const localDepositByTxHash = getLocalDepositByTxHash(depositTxHash);

    if (localDepositByTxHash) {
      removeLocalDeposits([depositTxHash]);
    }

    // Add to local storage with fill information
    // Use the strategy-specific conversion method
    const localDeposit = fillStrategy.convertForFillQuery(
      fillInfo,
      fromBridgePagePayload
    );
    addLocalDeposit(localDeposit);

    // Record transfer properties
    const { quoteForAnalytics, depositArgs, tokenPrice } =
      fromBridgePagePayload;

    recordTransferUserProperties(
      BigNumber.from(depositArgs.amount),
      BigNumber.from(tokenPrice),
      getToken(quoteForAnalytics.tokenSymbol).decimals,
      quoteForAnalytics.tokenSymbol.toLowerCase(),
      Number(quoteForAnalytics.fromChainId),
      Number(quoteForAnalytics.toChainId),
      quoteForAnalytics.fromChainName
    );
  }, [fillQuery.data, depositTxHash, fromBridgePagePayload, fillStrategy]);

  const status: DepositStatus = !depositQuery.data?.depositTimestamp
    ? "depositing"
    : depositQuery.data?.status === "deposit-reverted"
      ? "deposit-reverted"
      : !fillQuery.data?.fillTxTimestamp
        ? "filling"
        : "filled";

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
