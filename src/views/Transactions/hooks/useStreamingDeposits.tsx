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

    console.log(
      `[Streaming] 🎬 Starting batch stream: ${queue.length} transaction${queue.length > 1 ? "s" : ""} queued`
    );
    console.log(
      `[Streaming] ⏱️  Delay between deposits: ${Math.round(delayBetweenDeposits)}ms`
    );

    const streamDeposit = (index: number) => {
      if (index >= queue.length) {
        isProcessing.current = false;
        console.log(
          `[Streaming] ✅ Batch complete: streamed ${queue.length}/${queue.length} transactions`
        );
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
        console.log(
          `[Streaming] ✅ Batch complete: streamed ${queue.length}/${queue.length} transactions`
        );
      }
    };

    streamDeposit(0);
  }, [maxVisibleRows, getDepositId, clearAnimationFlag]);

  useEffect(() => {
    if (!enabled || isInitialized.current || deposits.length === 0) return;

    const totalToShow = Math.min(maxVisibleRows, deposits.length);
    const streamCount = Math.min(INITIAL_STREAM_COUNT, deposits.length);

    console.log(
      `[Streaming] 🚀 Initializing streaming: ${deposits.length} total deposits`
    );
    console.log(
      `[Streaming] 📊 Will stream ${streamCount} newest, display ${totalToShow - streamCount} older immediately`
    );

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

    let updatedCount = 0;

    deposits.forEach((deposit) => {
      const depositId = getDepositId(deposit);

      if (previousDepositIds.current.has(depositId)) {
        setDisplayedDeposits((current) => {
          const index = current.findIndex((d) => getDepositId(d) === depositId);

          if (index !== -1 && hasChanged(current[index], deposit)) {
            updatedCount++;
            const updated = [...current];
            updated[index] = { ...deposit, isUpdated: true };
            clearAnimationFlag(depositId, "isUpdated");
            return updated;
          }

          return current;
        });
      }
    });

    if (updatedCount > 0) {
      console.log(
        `[Streaming] 🔄 Updated ${updatedCount} existing transaction${updatedCount > 1 ? "s" : ""}`
      );
    }

    if (newDeposits.length > 0) {
      console.log(
        `[Streaming] 🆕 Detected ${newDeposits.length} new transaction${newDeposits.length > 1 ? "s" : ""}`
      );
      console.log(
        `[Streaming] 📦 Queue state: ${depositQueueRef.current.length} already queued + ${newDeposits.length} new = ${depositQueueRef.current.length + newDeposits.length} total`
      );

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

  useEffect(() => {
    if (enabled) {
      console.log("[Streaming] ▶️  Streaming enabled");
    } else {
      console.log(
        "[Streaming] ⏸️  Streaming disabled - displaying all deposits"
      );
    }
  }, [enabled]);

  if (!enabled) {
    return deposits;
  }

  return displayedDeposits;
}
