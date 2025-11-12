import { IndexerDeposit } from "hooks/useDeposits";

/**
 * Configuration for deposit streaming behavior
 */
export type StreamingConfig = {
  initialStreamCount: number;
  animationDuration: number;
  refetchInterval: number;
};

/**
 * Domain state for deposit streaming
 */
export type StreamingState = {
  displayed: IndexerDeposit[];
  processed: Set<string>;
  queue: IndexerDeposit[];
  initialized: boolean;
};

/**
 * Result of detecting changes in deposits
 */
export type UpdateResult = {
  newDeposits: IndexerDeposit[];
  updatedDeposits: { index: number; deposit: IndexerDeposit }[];
};

/**
 * Generate unique identifier for a deposit
 */
export function getDepositId(deposit: IndexerDeposit): string {
  return `${deposit.originChainId}-${deposit.depositId}`;
}

/**
 * Check if a deposit has changed (status, fillTx, or timestamp)
 */
export function hasDepositChanged(
  prev: IndexerDeposit,
  curr: IndexerDeposit
): boolean {
  return (
    prev.status !== curr.status ||
    prev.fillTx !== curr.fillTx ||
    prev.fillBlockTimestamp !== curr.fillBlockTimestamp
  );
}

/**
 * Calculate delay between streaming deposits
 */
export function calculateStreamDelay(
  queueLength: number,
  refetchInterval: number
): number {
  return queueLength > 0 ? refetchInterval / queueLength : 0;
}

/**
 * Initialize streaming state by partitioning deposits into immediate display and queue
 */
export function initializeStreamingState(
  deposits: IndexerDeposit[],
  config: StreamingConfig,
  maxRows: number
): StreamingState {
  if (deposits.length === 0) {
    return {
      displayed: [],
      processed: new Set(),
      queue: [],
      initialized: true,
    };
  }

  const totalToShow = Math.min(maxRows, deposits.length);
  const streamCount = Math.min(config.initialStreamCount, deposits.length);

  const toQueue = deposits.slice(0, streamCount);
  const toDisplay = deposits.slice(streamCount, totalToShow);

  return {
    displayed: toDisplay,
    processed: new Set(deposits.map(getDepositId)),
    queue: toQueue,
    initialized: true,
  };
}

/**
 * Detect new deposits and updated existing deposits
 */
export function detectChanges(
  currentDisplayed: IndexerDeposit[],
  incomingDeposits: IndexerDeposit[],
  processedIds: Set<string>
): UpdateResult {
  const newDeposits: IndexerDeposit[] = [];
  const updatedDeposits: Array<{ index: number; deposit: IndexerDeposit }> = [];

  for (const incoming of incomingDeposits) {
    const id = getDepositId(incoming);

    if (!processedIds.has(id)) {
      newDeposits.push(incoming);
    } else {
      const displayedIndex = currentDisplayed.findIndex(
        (d) => getDepositId(d) === id
      );

      if (
        displayedIndex !== -1 &&
        hasDepositChanged(currentDisplayed[displayedIndex], incoming)
      ) {
        updatedDeposits.push({ index: displayedIndex, deposit: incoming });
      }
    }
  }

  return { newDeposits, updatedDeposits };
}

/**
 * Add a deposit to the displayed list (prepend and respect max rows)
 */
export function addToDisplayed(
  current: IndexerDeposit[],
  newDeposit: IndexerDeposit,
  maxRows: number
): IndexerDeposit[] {
  return [newDeposit, ...current].slice(0, maxRows);
}

/**
 * Apply an update to a specific deposit in the displayed list
 */
export function applyUpdate(
  current: IndexerDeposit[],
  index: number,
  deposit: IndexerDeposit
): IndexerDeposit[] {
  const updated = [...current];
  updated[index] = deposit;
  return updated;
}
