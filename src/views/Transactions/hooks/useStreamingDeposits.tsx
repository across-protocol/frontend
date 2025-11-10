import { useEffect, useRef, useState } from "react";
import { IndexerDeposit } from "hooks/useDeposits";
import { defaultRefetchInterval } from "../../../utils";

export function useStreamingDeposits(
  deposits: IndexerDeposit[],
  enabled: boolean = true
) {
  const [displayedDeposits, setDisplayedDeposits] = useState<IndexerDeposit[]>(
    []
  );
  const [depositQueue, setDepositQueue] = useState<IndexerDeposit[]>([]);
  const processingRef = useRef(false);
  const previousIdsRef = useRef(new Set<string>());
  const initializedRef = useRef(false);

  // Initialize with existing deposits on first load
  useEffect(() => {
    if (!initializedRef.current && deposits.length > 0 && enabled) {
      setDisplayedDeposits(deposits);
      previousIdsRef.current = new Set(
        deposits.map((d) => `${d.originChainId}-${d.depositId}`)
      );
      initializedRef.current = true;
    }
  }, [deposits, enabled]);

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

  // Process queue: add one deposit at a time with even spacing
  useEffect(() => {
    if (depositQueue.length === 0 || processingRef.current || !enabled) {
      return;
    }

    processingRef.current = true;

    // Calculate delay: distribute deposits evenly over the fetch interval
    const delayPerDeposit = defaultRefetchInterval / depositQueue.length;

    const processNextDeposit = () => {
      setDepositQueue((prev) => {
        if (prev.length === 0) {
          processingRef.current = false;
          return prev;
        }

        const [nextDeposit, ...remaining] = prev;
        setDisplayedDeposits((current) => [nextDeposit, ...current]); // Prepend new deposits

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

  // If streaming is disabled, just return the deposits as-is
  if (!enabled) {
    return deposits;
  }

  return displayedDeposits;
}
