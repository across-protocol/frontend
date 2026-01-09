import {
  CHAIN_IDs,
  INDIRECT_CHAINS,
  interchangeableTokensMap,
} from "../../../../utils/constants";
import { solana } from "../../../../constants/chains/configs";
import { EnrichedToken } from "./ChainTokenSelectorModal";

export type RouteParams = {
  fromChainId: number;
  fromSymbol: string;
  toChainId: number;
  toSymbol: string;
};

export type RestrictedRoute = {
  [K in keyof RouteParams]: "*" | RouteParams[K][];
};

// hardcoded restricted routes
const RESTRICTED_ROUTES: RestrictedRoute[] = [
  {
    fromChainId: "*",
    fromSymbol: ["USDC.e"],
    toChainId: [CHAIN_IDs.HYPERCORE],
    toSymbol: ["USDH-SPOT"],
  },
  {
    fromChainId: "*",
    fromSymbol: ["USDT*"],
    toChainId: [CHAIN_IDs.HYPERCORE],
    toSymbol: ["USDH-SPOT"],
  },
  {
    fromChainId: "*",
    fromSymbol: ["USDC*"],
    toChainId: [CHAIN_IDs.HYPERCORE],
    toSymbol: ["USDT-SPOT"],
  },
  {
    fromChainId: "*",
    fromSymbol: ["USDT*"],
    toChainId: [CHAIN_IDs.HYPERCORE],
    toSymbol: ["USDC-SPOT"],
  },
  // Only USDC can be bridged to USDH on HyperEVM
  {
    fromChainId: "*",
    fromSymbol: ["!USDC"],
    toChainId: [CHAIN_IDs.HYPEREVM],
    toSymbol: ["USDH"],
  },
  // only allow bridegable output to SOlana
  {
    fromChainId: "*",
    fromSymbol: ["*"],
    toChainId: [CHAIN_IDs.SOLANA],
    toSymbol: ["!USDC"],
  },
];

// simple glob tester. supports only:  ["*" , "!"]
export function matchesGlob(pattern: string, value: string): boolean {
  const negate = pattern.startsWith("!");
  const raw = negate ? pattern.slice(1) : pattern;

  // escape regex meta characters
  const escaped = raw.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  const body = escaped.replace(/\*/g, ".*");

  const positive = new RegExp(`^${body}$`);

  return negate ? !positive.test(value) : positive.test(value);
}

export function matchesRestrictedRoute(
  route: RouteParams,
  restriction: RestrictedRoute
): boolean {
  // helper
  const matches = <T>(restrictionValue: "*" | T[], routeValue: T): boolean => {
    // Special case: "*" matches everything
    if (restrictionValue === "*") {
      return true;
    }

    const routeValueStr = String(routeValue);

    return restrictionValue.some((pattern) => {
      const patternStr = String(pattern);
      return matchesGlob(patternStr, routeValueStr);
    });
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
 * Checks if a token should be marked unreachable when Solana is involved.
 * When Solana is either origin or destination chain, only bridgeable tokens
 * should be allowed as output tokens.
 */
function isNonBridgeableSvmTokenUnreachable(
  token: EnrichedToken,
  isOriginToken: boolean,
  otherToken: EnrichedToken | null | undefined
): boolean {
  // Only apply this check when selecting destination tokens (output tokens)
  if (isOriginToken) return false;

  // Check if Solana is either origin or destination chain
  const isSolanaOrigin = otherToken?.chainId === CHAIN_IDs.SOLANA;
  const isSolanaDestination = token.chainId === CHAIN_IDs.SOLANA;

  // If Solana is not involved, don't mark as unreachable
  if (!(isSolanaOrigin || isSolanaDestination)) return false;

  // If Solana is involved, check if token is bridgeable
  const bridgeableSvmTokenSymbols = [
    "USDC",
    "USDH",
    "USDH-SPOT",
    "USDC-SPOT",
    "USDT-SPOT",
  ];

  const isBridgeable =
    bridgeableSvmTokenSymbols.includes(token.symbol) ||
    bridgeableSvmTokenSymbols.some((symbol) =>
      interchangeableTokensMap[token.symbol]?.includes(symbol)
    );

  // Mark as unreachable if not bridgeable
  return !isBridgeable;
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

  // Check if token should be unreachable due to Solana bridgeable token restrictions
  const isNonBridgeableSvm = isNonBridgeableSvmTokenUnreachable(
    token,
    isOriginToken,
    otherToken
  );

  // Combine all unreachability checks
  return (
    isSameChain || isRestrictedOrigin || isRestrictedRoute || isNonBridgeableSvm
  );
}
