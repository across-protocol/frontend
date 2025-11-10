import { useEffect, useRef, useState } from "react";
import { IndexerDeposit } from "hooks/useDeposits";
import { defaultRefetchInterval } from "../../../utils";

export type StreamedDeposit = IndexerDeposit & {
  isNewlyStreamed?: boolean;
};

const ANIMATION_DURATION = 1000; // 1 second animation
const INITIAL_STREAM_COUNT = 10; // Stream the last 10 deposits on initial load

export function useStreamingDeposits(
  deposits: IndexerDeposit[],
  maxVisibleRows: number,
  enabled: boolean = true
): StreamedDeposit[] {
  const [displayedDeposits, setDisplayedDeposits] = useState<StreamedDeposit[]>(
    []
  );
  const [depositQueue, setDepositQueue] = useState<IndexerDeposit[]>([]);
  const processingRef = useRef(false);
  const previousIdsRef = useRef(new Set<string>());
  const initializedRef = useRef(false);
  const animationTimeoutsRef = useRef<Map<string, number>>(new Map());

  // Initialize: stream last N deposits, show the rest instantly
  useEffect(() => {
    if (!initializedRef.current && deposits.length > 0 && enabled) {
      const depositsToStream = Math.min(INITIAL_STREAM_COUNT, deposits.length);
      const totalToShow = Math.min(maxVisibleRows, deposits.length);
      const olderDepositsCount = totalToShow - depositsToStream;

      const olderDeposits = deposits.slice(depositsToStream, totalToShow);
      const newerDeposits = deposits.slice(0, depositsToStream);

      // Show older deposits instantly without animation
      setDisplayedDeposits(olderDeposits);

      // Queue newer deposits for streaming
      setDepositQueue(newerDeposits);

      previousIdsRef.current = new Set(
        deposits.map((d) => `${d.originChainId}-${d.depositId}`)
      );
      initializedRef.current = true;
    }
  }, [deposits, enabled, maxVisibleRows]);

  // Detect new deposits and add them to the queue
  useEffect(() => {
    if (!enabled || !initializedRef.current || deposits.length === 0) {
      return;
    }

    const currentIds = new Set(
      deposits.map((d) => `${d.originChainId}-${d.depositId}`)
    );
    const newDeposits = deposits.filter(
      (deposit) =>
        !previousIdsRef.current.has(
          `${deposit.originChainId}-${deposit.depositId}`
        )
    );

    if (newDeposits.length > 0) {
      setDepositQueue((prev) => [...prev, ...newDeposits]);
      previousIdsRef.current = currentIds;
    }
  }, [deposits, enabled]);

  // Process queue: add one deposit at a time, evenly distributed over the fetch interval
  useEffect(() => {
    if (depositQueue.length === 0 || processingRef.current || !enabled) {
      return;
    }

    processingRef.current = true;

    // Distribute deposits evenly over the full fetch interval
    const delayPerDeposit = defaultRefetchInterval / depositQueue.length;

    const processNextDeposit = () => {
      setDepositQueue((prev) => {
        if (prev.length === 0) {
          processingRef.current = false;
          return prev;
        }

        const [nextDeposit, ...remaining] = prev;
        const depositId = `${nextDeposit.originChainId}-${nextDeposit.depositId}`;

        // Add deposit with animation flag and remove oldest if exceeding limit
        setDisplayedDeposits((current) => {
          const updated = [
            { ...nextDeposit, isNewlyStreamed: true },
            ...current,
          ];
          // Keep only the most recent deposits based on maxVisibleRows
          return updated.slice(0, maxVisibleRows);
        });

        // Remove animation flag after animation completes
        const timeoutId = setTimeout(() => {
          setDisplayedDeposits((current) =>
            current.map((d) =>
              `${d.originChainId}-${d.depositId}` === depositId
                ? { ...d, isNewlyStreamed: false }
                : d
            )
          );
          animationTimeoutsRef.current.delete(depositId);
        }, ANIMATION_DURATION);

        animationTimeoutsRef.current.set(depositId, timeoutId);

        // Process next deposit after calculated delay
        if (remaining.length > 0) {
          setTimeout(processNextDeposit, delayPerDeposit);
        } else {
          processingRef.current = false;
        }

        return remaining;
      });
    };

    processNextDeposit();
  }, [depositQueue.length, enabled]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      animationTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      animationTimeoutsRef.current.clear();
    };
  }, []);

  // If streaming is disabled, just return the deposits as-is
  if (!enabled) {
    return deposits;
  }

  return displayedDeposits;
}
