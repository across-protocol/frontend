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
  chainIsSvm,
} from "utils";
import {
  getLocalDepositByTxHash,
  addLocalDeposit,
  removeLocalDeposits,
} from "utils/local-deposits";
import { ampli } from "ampli";
import { createChainStrategies } from "utils/deposit-strategies";

import { FromBridgePagePayload } from "views/Bridge/hooks/useBridgeAction";
import {
  DepositStatus,
  FillInfo,
  FillStatus,
} from "./useDepositTracking_new/types";

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
  const [depositStatus, setDepositStatus] = useState<DepositStatus>({
    isLoading: true,
    isSuccess: false,
    isError: false,
  });
  const [fillStatus, setFillStatus] = useState<FillStatus>({
    isLoading: false,
    isSuccess: false,
    isError: false,
  });

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
        // Use the strategy to get deposit information
        return depositStrategy.getDeposit(depositTxHash);
      } catch (e) {
        // Don't retry if the deposit doesn't exist or is invalid
        setShouldRetryDepositQuery(false);
        throw e;
      }
    },
    staleTime: Infinity,
    enabled: shouldRetryDepositQuery,
    retryDelay: getRetryDelay(fromChainId),
  });

  // Update deposit status when depositQuery changes
  useEffect(() => {
    if (depositQuery.isLoading) {
      setDepositStatus({
        isLoading: true,
        isSuccess: false,
        isError: false,
      });
    } else if (depositQuery.isError) {
      setDepositStatus({
        isLoading: false,
        isSuccess: false,
        isError: true,
      });
    } else if (depositQuery.data) {
      setDepositStatus({
        isLoading: false,
        isSuccess: true,
        isError: false,
        timestamp: depositQuery.data.depositTimestamp,
      });
    }
  }, [depositQuery.isLoading, depositQuery.isError, depositQuery.data]);

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
    const isFromCurrentUser = depositInfo.depositLog.args.depositor === account;
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
          data.depositTimestamp,
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

      if (!depositInfo || depositInfo.status === "depositing") {
        return;
      }

      // Use the strategy to get fill information, passing the destination chain ID
      return fillStrategy.getFill(depositInfo, toChainId);
    },
    staleTime: Infinity,
    retry: true,
    retryDelay: getRetryDelay(toChainId),
    enabled: !!depositQuery.data,
  });

  // Update fill status when fillQuery changes
  useEffect(() => {
    if (fillQuery.isLoading) {
      setFillStatus({
        isLoading: true,
        isSuccess: false,
        isError: false,
      });
    } else if (fillQuery.isError) {
      setFillStatus({
        isLoading: false,
        isSuccess: false,
        isError: true,
      });
    } else if (fillQuery.data) {
      setFillStatus({
        isLoading: false,
        isSuccess: true,
        isError: false,
        timestamp: fillQuery.data.fillTxTimestamp,
      });
    }
  }, [fillQuery.isLoading, fillQuery.isError, fillQuery.data]);

  // Track fill in local storage
  useEffect(() => {
    const fillInfo = fillQuery.data as FillInfo;

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

  return {
    depositQuery,
    fillQuery,
    depositStatus,
    fillStatus,
    // Return the origin and destination chain types for convenience
    isFromSVM: chainIsSvm(fromChainId),
    isToSVM: chainIsSvm(toChainId),
  };
}

function getRetryDelay(chainId: number) {
  const pollingInterval = getChainInfo(chainId).pollingInterval || 1_000;
  return Math.floor(pollingInterval / 3);
}
