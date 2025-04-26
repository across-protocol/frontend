import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { BigNumber } from "ethers";

import { useAmplitude, useConnection } from "hooks";
import {
  generateDepositConfirmed,
  getToken,
  recordTransferUserProperties,
  wait,
  getDepositByTxHash,
  getFillByDepositTxHash,
  NoFundsDepositedLogError,
  getChainInfo,
  toAddressSafe,
} from "utils";
import {
  getLocalDepositByTxHash,
  addLocalDeposit,
  removeLocalDeposits,
} from "utils/local-deposits";
import { ampli } from "ampli";

import { convertForDepositQuery, convertForFillQuery } from "../utils";
import { FromBridgePagePayload } from "views/Bridge/hooks/useBridgeAction";

export function useDepositTracking(
  depositTxHash: string,
  fromChainId: number,
  toChainId: number,
  fromBridgePagePayload?: FromBridgePagePayload
) {
  const [shouldRetryDepositQuery, setShouldRetryDepositQuery] = useState(true);

  const { addToAmpliQueue } = useAmplitude();
  const { account } = useConnection();

  const depositQuery = useQuery({
    queryKey: ["deposit", depositTxHash, fromChainId, account],
    queryFn: async () => {
      // On some L2s the tx is mined too fast for the animation to show, so we add a delay
      await wait(1_000);

      try {
        const deposit = await getDepositByTxHash(depositTxHash, fromChainId);
        return deposit;
      } catch (e) {
        // If the error NoFundsDepositedLogError is thrown, this implies that the used
        // tx hash is valid and mined but the origin is not a SpokePool contract. So we
        // should not retry the query and throw the error.
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

  useEffect(() => {
    const data = depositQuery.data;

    if (!fromBridgePagePayload || !data || !data.parsedDepositLog) {
      return;
    }

    const localDepositByTxHash = getLocalDepositByTxHash(depositTxHash);
    if (!localDepositByTxHash) {
      // Optimistically add deposit to local storage for instant visibility on the
      // "My Transactions" page. See `src/hooks/useDeposits.ts` for details.
      addLocalDeposit(convertForDepositQuery(data, fromBridgePagePayload));
    }

    const depositor = toAddressSafe(data.parsedDepositLog.args.depositor);
    if (account !== depositor) {
      return;
    }

    addToAmpliQueue(() => {
      ampli.transferDepositCompleted(
        generateDepositConfirmed(
          fromBridgePagePayload.quoteForAnalytics,
          fromBridgePagePayload.referrer,
          fromBridgePagePayload.timeSigned,
          data.depositTxReceipt.transactionHash,
          true,
          data.depositTimestamp
        )
      );
    });
  }, [
    depositQuery.data,
    addToAmpliQueue,
    fromBridgePagePayload,
    account,
    depositTxHash,
  ]);

  const fillQuery = useQuery({
    queryKey: [
      "fill-by-deposit-tx-hash",
      depositTxHash,
      fromChainId,
      toChainId,
    ],
    queryFn: async () => {
      if (!depositQuery.data) {
        throw new Error(
          `Could not fetch deposit by tx hash ${depositTxHash} on chain ${fromChainId}`
        );
      }

      return getFillByDepositTxHash(
        depositTxHash,
        fromChainId,
        toChainId,
        depositQuery.data
      );
    },
    staleTime: Infinity,
    retry: true,
    retryDelay: getRetryDelay(toChainId),
    enabled: !!depositQuery.data,
  });

  useEffect(() => {
    if (!fromBridgePagePayload || !fillQuery.data) {
      return;
    }

    const localDepositByTxHash = getLocalDepositByTxHash(depositTxHash);
    if (localDepositByTxHash) {
      removeLocalDeposits([depositTxHash]);
    }

    // Optimistically add deposit to local storage for instant visibility on the
    // "My Transactions" page. See `src/hooks/useDeposits.ts` for details.
    addLocalDeposit(convertForFillQuery(fillQuery.data, fromBridgePagePayload));

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
  }, [fillQuery.data, depositTxHash, fromBridgePagePayload]);

  return { depositQuery, fillQuery };
}

function getRetryDelay(chainId: number) {
  const pollingInterval = getChainInfo(chainId).pollingInterval || 1_000;
  return Math.floor(pollingInterval / 3);
}
