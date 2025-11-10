import { useCallback, useEffect, useRef, useState } from "react";
import { IndexerDeposit } from "hooks/useDeposits";
import { defaultRefetchInterval } from "../../../utils";

export type StreamedDeposit = IndexerDeposit & {
  isNewlyStreamed?: boolean;
  isUpdated?: boolean;
};

const ANIMATION_DURATION = 1000;
const INITIAL_STREAM_COUNT = 10;

export function useStreamingDeposits(
  deposits: IndexerDeposit[],
  maxVisibleRows: number,
  enabled: boolean = true
): StreamedDeposit[] {
  const [displayedDeposits, setDisplayedDeposits] = useState<StreamedDeposit[]>(
    []
  );
  const isProcessing = useRef(false);
  const previousDepositIds = useRef(new Set<string>());
  const isInitialized = useRef(false);
  const animationTimeouts = useRef<Map<string, number>>(new Map());
  const depositQueueRef = useRef<IndexerDeposit[]>([]);

  const getDepositId = useCallback(
    (deposit: IndexerDeposit) =>
      `${deposit.originChainId}-${deposit.depositId}`,
    []
  );

  const clearAnimationFlag = useCallback(
    (depositId: string, flag: "isNewlyStreamed" | "isUpdated") => {
      const timeoutId = setTimeout(() => {
        setDisplayedDeposits((current) =>
          current.map((d) =>
            getDepositId(d) === depositId ? { ...d, [flag]: false } : d
          )
        );
        animationTimeouts.current.delete(depositId);
      }, ANIMATION_DURATION);

      animationTimeouts.current.set(depositId, timeoutId);
    },
    [getDepositId]
  );

  const startStreaming = useCallback(() => {
    if (isProcessing.current || depositQueueRef.current.length === 0) return;

    isProcessing.current = true;
    const queue = [...depositQueueRef.current];
    depositQueueRef.current = [];

    const delayBetweenDeposits = defaultRefetchInterval / queue.length;

    const streamDeposit = (index: number) => {
      if (index >= queue.length) {
        isProcessing.current = false;
        return;
      }

      const deposit = queue[index];
      const depositId = getDepositId(deposit);

      setDisplayedDeposits((current) => {
        const withNewDeposit = [
          { ...deposit, isNewlyStreamed: true },
          ...current,
        ];
        return withNewDeposit.slice(0, maxVisibleRows);
      });

      clearAnimationFlag(depositId, "isNewlyStreamed");

      if (index < queue.length - 1) {
        setTimeout(() => streamDeposit(index + 1), delayBetweenDeposits);
      } else {
        isProcessing.current = false;
      }
    };

    streamDeposit(0);
  }, [maxVisibleRows, getDepositId, clearAnimationFlag]);

  useEffect(() => {
    if (!enabled || isInitialized.current || deposits.length === 0) return;

    const totalToShow = Math.min(maxVisibleRows, deposits.length);
    const streamCount = Math.min(INITIAL_STREAM_COUNT, deposits.length);

    const olderDeposits = deposits.slice(streamCount, totalToShow);
    setDisplayedDeposits(olderDeposits);

    const recentDeposits = deposits.slice(0, streamCount);
    depositQueueRef.current = recentDeposits;
    startStreaming();

    previousDepositIds.current = new Set(deposits.map(getDepositId));
    isInitialized.current = true;
  }, [enabled, deposits, maxVisibleRows, getDepositId, startStreaming]);

  useEffect(() => {
    if (!enabled || !isInitialized.current || deposits.length === 0) return;

    const currentIds = new Set(deposits.map(getDepositId));

    const newDeposits = deposits.filter(
      (deposit) => !previousDepositIds.current.has(getDepositId(deposit))
    );

    const hasChanged = (existing: IndexerDeposit, incoming: IndexerDeposit) =>
      existing.status !== incoming.status ||
      existing.fillTx !== incoming.fillTx ||
      existing.fillBlockTimestamp !== incoming.fillBlockTimestamp;

    deposits.forEach((deposit) => {
      const depositId = getDepositId(deposit);

      if (previousDepositIds.current.has(depositId)) {
        setDisplayedDeposits((current) => {
          const index = current.findIndex((d) => getDepositId(d) === depositId);

          if (index !== -1 && hasChanged(current[index], deposit)) {
            const updated = [...current];
            updated[index] = { ...deposit, isUpdated: true };
            clearAnimationFlag(depositId, "isUpdated");
            return updated;
          }

          return current;
        });
      }
    });

    if (newDeposits.length > 0) {
      depositQueueRef.current = [...depositQueueRef.current, ...newDeposits];
      previousDepositIds.current = currentIds;
      startStreaming();
    }
  }, [enabled, deposits, getDepositId, clearAnimationFlag, startStreaming]);

  useEffect(() => {
    const timeouts = animationTimeouts.current;
    return () => {
      timeouts.forEach(clearTimeout);
      timeouts.clear();
    };
  }, []);

  if (!enabled) {
    return deposits;
  }

  return displayedDeposits;
}
