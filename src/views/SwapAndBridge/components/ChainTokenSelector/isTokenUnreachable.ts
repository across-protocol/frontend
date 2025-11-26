import { INDIRECT_CHAINS } from "../../../../utils";
import { EnrichedToken } from "./ChainTokenSelectorModal";

/**
 * Determines if a token is unreachable due to restricted origin chains
 * for indirect destination chains (e.g., Hypercore).
 *
 * @param isOriginToken - Whether we're selecting an origin token
 * @param otherToken - The other token (destination if selecting origin, origin if selecting destination)
 * @returns A function that takes a token and returns true if it's unreachable
 */
export const getRestrictedOriginChainsUnreachable =
  (isOriginToken: boolean, otherToken: EnrichedToken | null | undefined) =>
  (token: EnrichedToken): boolean => {
    if (!otherToken) return false;

    const destinationChainId = isOriginToken
      ? otherToken.chainId
      : token.chainId;
    const originChainId = isOriginToken ? token.chainId : otherToken.chainId;

    const destinationChain = INDIRECT_CHAINS[destinationChainId];
    return (
      !!destinationChain?.restrictedOriginChains &&
      destinationChain.restrictedOriginChains.includes(originChainId)
    );
  };

/**
 * Determines if a token is unreachable based on various criteria.
 * This is a parent function that combines multiple unreachability checks,
 * making it easy to add more checks in the future.
 *
 * @param isOriginToken - Whether we're selecting an origin token
 * @param otherToken - The other token (destination if selecting origin, origin if selecting destination)
 * @returns A function that takes a token and returns true if it's unreachable
 */
export const isTokenUnreachable =
  (isOriginToken: boolean, otherToken: EnrichedToken | null | undefined) =>
  (token: EnrichedToken): boolean => {
    // Check if token is from the same chain as the other token
    const isSameChain = otherToken
      ? token.chainId === otherToken.chainId
      : false;

    // Check if token is unreachable due to restricted origin chains for indirect destinations
    const isRestrictedOrigin = getRestrictedOriginChainsUnreachable(
      isOriginToken,
      otherToken
    )(token);

    // Combine all unreachability checks
    return isSameChain || isRestrictedOrigin;
  };
