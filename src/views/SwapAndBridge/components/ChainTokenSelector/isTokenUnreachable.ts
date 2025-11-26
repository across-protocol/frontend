import { INDIRECT_CHAINS } from "../../../../utils/constants";
import { EnrichedToken } from "./ChainTokenSelectorModal";

function getRestrictedOriginChainsUnreachable(
  token: EnrichedToken,
  isOriginToken: boolean,
  otherToken: EnrichedToken | null | undefined
): boolean {
  if (!otherToken) return false;

  const destinationChainId = isOriginToken ? otherToken.chainId : token.chainId;
  const originChainId = isOriginToken ? token.chainId : otherToken.chainId;

  const destinationChain = INDIRECT_CHAINS[destinationChainId];
  return (
    !!destinationChain?.restrictedOriginChains &&
    destinationChain.restrictedOriginChains.includes(originChainId)
  );
}

/**
 * Determines if a token is unreachable based on various criteria.
 *
 * @param token - The token to check for unreachability
 * @param isOriginToken - Whether we're selecting an origin token
 * @param otherToken - The other token (destination if selecting origin, origin if selecting destination)
 * @returns true if the token is unreachable, false otherwise
 */
export function isTokenUnreachable(
  token: EnrichedToken,
  isOriginToken: boolean,
  otherToken: EnrichedToken | null | undefined
): boolean {
  // Check if token is from the same chain as the other token
  const isSameChain = otherToken ? token.chainId === otherToken.chainId : false;

  // Check if token is unreachable due to restricted origin chains for indirect destinations
  const isRestrictedOrigin = getRestrictedOriginChainsUnreachable(
    token,
    isOriginToken,
    otherToken
  );

  // Combine all unreachability checks
  return isSameChain || isRestrictedOrigin;
}
