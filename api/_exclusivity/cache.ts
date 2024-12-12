import { assert, is } from "superstruct";
import { buildCacheKey, redisCache } from "../_cache";
import { RelayerFillLimit, RelayerFillLimitArraySchema } from "../_types";

/**
 * A constant caching prefix that will prepend all exclusivity keys.
 */
const EXCLUSIVITY_CACHE_PREFIX = "exclusivity";

/**
 * Builds a cache key for relayer fill limit data.
 *
 * @param {string} relayer - The unique identifier for the relayer.
 * @param {number | string} originChainId - The ID of the origin chain.
 * @param {number | string} destinationChainId - The ID of the destination chain.
 * @param {string} inputToken - The token being input.
 * @param {string} outputToken - The token being output.
 * @returns {string} A formatted cache key.
 */
function buildRelayerFillLimitCacheKey(
  relayer: string,
  originChainId: number | string,
  destinationChainId: number | string,
  inputToken: string,
  outputToken: string
): string {
  return buildCacheKey(
    EXCLUSIVITY_CACHE_PREFIX,
    relayer.toLowerCase(),
    originChainId,
    destinationChainId,
    inputToken.toLowerCase(),
    outputToken.toLowerCase()
  );
}

/**
 * Retrieves a series of fill limits specified by a relayer.
 *
 * @param {string} relayer - The unique identifier for the relayer.
 * @param {number} originChainId - The ID of the origin chain.
 * @param {number} destinationChainId - The ID of the destination chain.
 * @param {string} inputToken - The token being input.
 * @param {string} outputToken - The token being output.
 * @returns {Promise<RelayerFillLimit[] | null>} An array of relayer fill limits or null if none exist.
 */
export async function getCachedRelayerFillLimit(
  relayer: string,
  originChainId: number,
  destinationChainId: number,
  inputToken: string,
  outputToken: string
): Promise<RelayerFillLimit[] | null> {
  const result = await redisCache.get<RelayerFillLimit[]>(
    buildRelayerFillLimitCacheKey(
      relayer,
      originChainId,
      destinationChainId,
      inputToken,
      outputToken
    )
  );
  return is(result, RelayerFillLimitArraySchema) ? result : null;
}

/**
 * Sets a series of relayer fill limits in the cache.
 *
 * @param {string} relayer - The unique identifier for the relayer.
 * @param {originChainId} originChainId - The origin chain of the route.
 * @param {inputToken} inputToken - The input token on the origin chain.
 * @param {destinationChainId} destinationChainId - The destination chain of the route.
 * @param {outputToken} outputToken - The output token on the destination chain.
 * @param {RelayerFillLimit[]} entries - An array of relayer fill limit entries to store.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
export async function setCachedRelayerFillLimit(
  relayer: string,
  originChainId: number,
  inputToken: string,
  destinationChainId: number,
  outputToken: string,
  entries: RelayerFillLimit[]
): Promise<void> {
  // Confirm what we're about to push to the cache is formatted properly
  assert(entries, RelayerFillLimitArraySchema);
  await Promise.all(
    entries.map((entry) =>
      redisCache.set(
        buildRelayerFillLimitCacheKey(
          relayer,
          originChainId,
          destinationChainId,
          inputToken,
          outputToken
        ),
        entry,
        600
      )
    )
  );
}
