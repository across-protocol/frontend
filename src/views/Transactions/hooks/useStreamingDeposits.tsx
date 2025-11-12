import { useCallback, useEffect, useRef, useState } from "react";
import { IndexerDeposit } from "hooks/useDeposits";
import { defaultRefetchInterval } from "../../../utils";
import {
  addToDisplayed,
  applyUpdate,
  calculateStreamDelay,
  detectChanges,
  getDepositId,
  initializeStreamingState,
  StreamingConfig,
} from "../domain/depositStreaming";

export type StreamedDeposit = IndexerDeposit & {
  streamedAt?: number;
  updatedAt?: number;
};

const STREAMING_CONFIG: StreamingConfig = {
  initialStreamCount: 10,
  animationDuration: 1000,
  refetchInterval: defaultRefetchInterval,
};

export function useStreamingDeposits(
  deposits: IndexerDeposit[],
  maxVisibleRows: number,
  enabled: boolean = true
): StreamedDeposit[] {
  const [displayedDeposits, setDisplayedDeposits] = useState<StreamedDeposit[]>(
    []
  );

  const processedIdsRef = useRef(new Set<string>());
  const queueRef = useRef<IndexerDeposit[]>([]);
  const isProcessingRef = useRef(false);

  const startStreaming = useCallback(() => {
    if (isProcessingRef.current || queueRef.current.length === 0) return;

    isProcessingRef.current = true;
    const queue = [...queueRef.current];
    queueRef.current = [];

    const delayBetweenDeposits = calculateStreamDelay(
      queue.length,
      STREAMING_CONFIG.refetchInterval
    );

    const streamDeposit = (index: number) => {
      if (index >= queue.length) {
        isProcessingRef.current = false;
        return;
      }

      const deposit = queue[index];

      setDisplayedDeposits((current) => {
        const withTimestamp = { ...deposit, streamedAt: Date.now() };
        return addToDisplayed(current, withTimestamp, maxVisibleRows);
      });

      if (index < queue.length - 1) {
        setTimeout(() => streamDeposit(index + 1), delayBetweenDeposits);
      } else {
        isProcessingRef.current = false;
      }
    };

    streamDeposit(0);
  }, [maxVisibleRows]);

  // Initialize streaming state
  useEffect(() => {
    if (!enabled || processedIdsRef.current.size > 0 || deposits.length === 0)
      return;

    const initialState = initializeStreamingState(
      deposits,
      STREAMING_CONFIG,
      maxVisibleRows
    );

    setDisplayedDeposits(initialState.displayed);
    processedIdsRef.current = initialState.processed;
    queueRef.current = initialState.queue;

    startStreaming();
  }, [enabled, deposits, maxVisibleRows, startStreaming]);

  // Detect changes and new deposits
  useEffect(() => {
    if (!enabled || processedIdsRef.current.size === 0 || deposits.length === 0)
      return;

    const changes = detectChanges(
      displayedDeposits,
      deposits,
      processedIdsRef.current
    );

    // Apply updates to existing deposits
    if (changes.updatedDeposits.length > 0) {
      setDisplayedDeposits((current) => {
        let updated = current;
        for (const { index, deposit } of changes.updatedDeposits) {
          const withTimestamp = { ...deposit, updatedAt: Date.now() };
          updated = applyUpdate(updated, index, withTimestamp);
        }
        return updated;
      });
    }

    // Queue new deposits for streaming
    if (changes.newDeposits.length > 0) {
      queueRef.current = [...queueRef.current, ...changes.newDeposits];
      processedIdsRef.current = new Set(deposits.map(getDepositId));
      startStreaming();
    }
  }, [enabled, deposits, displayedDeposits, startStreaming]);

  if (!enabled) {
    return deposits;
  }

  return displayedDeposits;
}
