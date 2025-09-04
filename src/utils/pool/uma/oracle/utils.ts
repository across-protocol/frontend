import { BigNumberish } from "../../../utils";
import sortedLastIndexBy from "lodash/sortedLastIndexBy";

/**
 * eventKey. Make a unique and sortable identifier string for an event
 * Used by poolClient.ts lines 166, 246
 *
 * @param {Event} event
 * @returns {string} - the unique id
 */
export function eventKey(event: {
  blockNumber: BigNumberish;
  transactionIndex: BigNumberish;
  logIndex: BigNumberish;
}): string {
  return [
    // we pad these because numbers of varying lengths will not sort correctly, ie "10" will incorrectly sort before "9", but "09" will be correct.
    event.blockNumber.toString().padStart(16, "0"),
    event.transactionIndex.toString().padStart(16, "0"),
    event.logIndex?.toString().padStart(16, "0"),
    // ~ is the last printable ascii char, so it does not interfere with sorting
  ].join("~");
}

/**
 * insertOrdered. Inserts items in an array maintaining sorted order, in this case lowest to highest. Does not check duplicates.
 * Mainly used for caching all known events, in order of oldest to newest.
 * Used by poolClient.ts line 181
 *
 * @param {T[]} array
 * @param {T} element
 * @param {Function} orderBy
 */
export function insertOrderedAscending<T>(
  array: T[],
  element: T,
  orderBy: (element: T) => string | number
): T[] {
  const index = sortedLastIndexBy(array, element, orderBy);
  array.splice(index, 0, element);
  return array;
}
