import {
  CHAIN_IDs,
  INDIRECT_CHAINS,
  TOKEN_SYMBOLS_MAP,
} from "../../../../utils/constants";
import { EnrichedToken } from "./ChainTokenSelectorModal";

// we may want to allow these fileds to be arrays
export type RestrictedRoute = {
  fromChainId: number | "*";
  fromSymbol: string | "*";
  toChainId: number | "*";
  toSymbol: string | "*";
};

export type RouteParams = Required<RestrictedRoute>;

// hardcoded restricted routes
const RESTRICTED_ROUTES: RestrictedRoute[] = [
  {
    fromChainId: "*",
    fromSymbol: TOKEN_SYMBOLS_MAP["USDC.e"].symbol,
    toChainId: CHAIN_IDs.HYPERCORE,
    toSymbol: TOKEN_SYMBOLS_MAP["USDH-SPOT"].symbol,
  },
];

export function matchesRestrictedRoute(
  route: RouteParams,
  restriction: RestrictedRoute
): boolean {
  // helper
  const matches = <T>(restrictionValue: T | "*", routeValue: T): boolean => {
    return restrictionValue === "*" || restrictionValue === routeValue;
  };

  return (
    matches(restriction.fromChainId, route.fromChainId) &&
    matches(restriction.fromSymbol, route.fromSymbol) &&
    matches(restriction.toChainId, route.toChainId) &&
    matches(restriction.toSymbol, route.toSymbol)
  );
}

function isRouteRestricted(route: RouteParams): boolean {
  return RESTRICTED_ROUTES.some((restriction) =>
    matchesRestrictedRoute(route, restriction)
  );
}

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

  const isRestrictedRoute = otherToken
    ? isRouteRestricted({
        fromChainId: isOriginToken ? token.chainId : otherToken.chainId,
        fromSymbol: isOriginToken ? token.symbol : otherToken.symbol,
        toChainId: isOriginToken ? otherToken.chainId : token.chainId,
        toSymbol: isOriginToken ? otherToken.symbol : token.symbol,
      })
    : false;

  // Combine all unreachability checks
  return isSameChain || isRestrictedOrigin || isRestrictedRoute;
}
