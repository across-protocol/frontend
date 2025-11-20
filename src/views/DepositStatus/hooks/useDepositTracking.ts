import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";

import { useAmplitude } from "hooks";
import {
  wait,
  getChainInfo,
  NoFundsDepositedLogError,
  debug,
  getEcosystem,
} from "utils";
import { FromBridgeAndSwapPagePayload } from "utils/local-deposits";
import { createChainStrategies } from "utils/deposit-strategies";
import { DepositStatus } from "../types";
import { DepositData } from "./useDepositTracking/types";
import { useConnectionSVM } from "hooks/useConnectionSVM";
import { useConnectionEVM } from "hooks/useConnectionEVM";
import { useToken } from "hooks/useToken";
import { makeUseUserTokenBalancesQueryKey } from "hooks/useUserTokenBalances";

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
  fromBridgeAndSwapPagePayload,
}: {
  depositTxHash: string;
  fromChainId: number;
  toChainId: number;
  fromBridgeAndSwapPagePayload?: FromBridgeAndSwapPagePayload;
}) {
  const [shouldRetryDepositQuery, setShouldRetryDepositQuery] = useState(true);

  const queryClient = useQueryClient();
  const { addToAmpliQueue } = useAmplitude();
  const { account: accountEVM } = useConnectionEVM();
  const { account: accountSVM } = useConnectionSVM();
  const account =
    getEcosystem(fromChainId) === "evm" ? accountEVM : accountSVM?.toBase58();

  // Resolve token info for analytics
  const tokenForAnalytics = useToken(
    fromBridgeAndSwapPagePayload?.swapQuote.inputToken.symbol || ""
  );

  // Create appropriate strategy for the source chain
  const { depositStrategy, fillStrategy } = useMemo(
    () => createChainStrategies(fromChainId, toChainId),
    [fromChainId, toChainId]
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

    if (!depositInfo || depositInfo.status === "depositing") {
      return;
    }

    // TODO
    // // Check if deposit is already in local storage
    // const localDepositByTxHash = getLocalDepositByTxHash(depositTxHash);

    // if (!localDepositByTxHash) {
    //   // Optimistically add deposit to local storage for instant visibility
    //   // Use the strategy-specific conversion method
    //   const localDeposit = depositStrategy.convertForDepositQuery(
    //     depositInfo,
    //     fromBridgeAndSwapPagePayload
    //   );
    //   addLocalDeposit(localDeposit);
    // }

    // Check if the deposit is from the current user
    const isFromCurrentUser =
      depositInfo.depositLog.depositor.toNative() === account;
    if (!isFromCurrentUser) {
      return;
    }

    // TODO
    //  Track deposit in Amplitude
    // addToAmpliQueue(() => {
    //   ampli.transferDepositCompleted(
    //     generateDepositConfirmed(
    //       fromBridgeAndSwapPagePayload.quoteForAnalytics,
    //       fromBridgeAndSwapPagePayload.referrer,
    //       fromBridgeAndSwapPagePayload.timeSigned,
    //       depositInfo.depositTxHash,
    //       true,
    //       depositInfo.depositTimestamp,
    //       fromBridgeAndSwapPagePayload.selectedRoute.fromTokenAddress,
    //       fromBridgeAndSwapPagePayload.selectedRoute.toTokenAddress
    //     )
    //   );
    // });
  }, [
    depositQuery.data,
    addToAmpliQueue,
    fromBridgeAndSwapPagePayload,
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

      if (depositInfo?.status !== "deposited") {
        return;
      }
      logRelayData(depositInfo.depositLog);
      // Use the strategy to get fill information through the normalized interface
      return await fillStrategy.getFill(depositInfo);
    },
    staleTime: Infinity,
    retry: true,
    retryDelay: getRetryDelay(toChainId),
    enabled: !!depositQuery.data && depositQuery.data.status === "deposited",
  });

  // Track fill in local storage
  useEffect(() => {
    const fillInfo = fillQuery.data;

    if (!fillInfo || fillInfo.status === "filling") {
      return;
    }
    // Refetch user balances
    queryClient.refetchQueries({
      queryKey: makeUseUserTokenBalancesQueryKey(),
      type: "all", // Refetch both active and inactive queries
    });

    // TODO
    // // Remove existing deposit and add updated one with fill information
    // const localDepositByTxHash = getLocalDepositByTxHash(depositTxHash);

    // if (localDepositByTxHash) {
    //   removeLocalDeposits([depositTxHash]);
    // }

    // TODO update deposit in localStorage. track in Amplitude
    // if (fromBridgeAndSwapPagePayload) {
    //   // Add to local storage with fill information
    //   // Use the strategy-specific conversion method
    //   const localDeposit = fillStrategy.convertForFillQuery(
    //     fillInfo,
    //     fromBridgeAndSwapPagePayload
    //   );
    //   addLocalDeposit(localDeposit);

    //   // Record transfer properties
    //   const { swapQuote, depositArgs, tokenPrice } =
    //     fromBridgeAndSwapPagePayload;

    //   // Only record if we have token info
    //   if (tokenForAnalytics) {
    //     recordTransferUserProperties(
    //       BigNumber.from(depositArgs.amount),
    //       BigNumber.from(tokenPrice),
    //       tokenForAnalytics.decimals,
    //       quoteForAnalytics.tokenSymbol.toLowerCase(),
    //       Number(quoteForAnalytics.fromChainId),
    //       Number(quoteForAnalytics.toChainId),
    //       quoteForAnalytics.fromChainName
    //     );
    //   }
    // }
  }, [
    fillQuery.data,
    depositTxHash,
    fromBridgeAndSwapPagePayload,
    fillStrategy,
    tokenForAnalytics,
    queryClient,
    fromChainId,
    toChainId,
    accountSVM,
    accountEVM,
  ]);

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
