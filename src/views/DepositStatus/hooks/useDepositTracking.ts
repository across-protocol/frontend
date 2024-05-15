import { useQuery } from "react-query";
import { useState } from "react";
import { BigNumber } from "ethers";

import { useAmplitude, useConnection } from "hooks";
import {
  generateDepositConfirmed,
  getToken,
  recordTransferUserProperties,
  wait,
  getDepositByTxHash,
  getFillByDepositTxHash,
  NoV3FundsDepositedLogError,
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

  const depositQuery = useQuery(
    ["deposit", depositTxHash, fromChainId, account],
    async () => {
      // On some L2s the tx is mined too fast for the animation to show, so we add a delay
      await wait(1_000);

      try {
        const deposit = await getDepositByTxHash(depositTxHash, fromChainId);
        return deposit;
      } catch (e) {
        // If the error NoV3FundsDepositedLogError is thrown, this implies that the used
        // tx hash is valid and mined but the origin is not a SpokePool contract. So we
        // should not retry the query and throw the error.
        if (e instanceof NoV3FundsDepositedLogError) {
          setShouldRetryDepositQuery(false);
        }
        throw e;
      }
    },
    {
      staleTime: Infinity,
      enabled: shouldRetryDepositQuery,
      onSuccess: (data) => {
        if (!fromBridgePagePayload || !data.parsedDepositLog) {
          return;
        }

        const localDepositByTxHash = getLocalDepositByTxHash(depositTxHash);
        if (!localDepositByTxHash) {
          // Optimistically add deposit to local storage for instant visibility on the
          // "My Transactions" page. See `src/hooks/useDeposits.ts` for details.
          addLocalDeposit(convertForDepositQuery(data, fromBridgePagePayload));
        }

        if (account !== data.parsedDepositLog.args.depositor) {
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
      },
    }
  );

  const fillQuery = useQuery(
    ["fill-by-deposit-tx-hash", depositTxHash, fromChainId, toChainId],
    async () => {
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
    {
      staleTime: Infinity,
      retry: true,
      enabled: !!depositQuery.data,
      onSuccess: (data) => {
        if (!fromBridgePagePayload) {
          return;
        }

        const localDepositByTxHash = getLocalDepositByTxHash(depositTxHash);
        if (localDepositByTxHash) {
          removeLocalDeposits([depositTxHash]);
        }

        // Optimistically add deposit to local storage for instant visibility on the
        // "My Transactions" page. See `src/hooks/useDeposits.ts` for details.
        addLocalDeposit(convertForFillQuery(data, fromBridgePagePayload));

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
      },
    }
  );

  return { depositQuery, fillQuery };
}
