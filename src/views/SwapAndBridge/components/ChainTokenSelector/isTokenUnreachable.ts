import {
  CHAIN_IDs,
  INDIRECT_CHAINS,
  interchangeableTokensMap,
} from "../../../../utils/constants";
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
  // Restrict USDT to USDC-SPOT route on chains without OFT support
  {
    fromChainId: [
      CHAIN_IDs.BASE,
      CHAIN_IDs.BLAST,
      CHAIN_IDs.BSC,
      CHAIN_IDs.HYPEREVM,
      CHAIN_IDs.INK,
      CHAIN_IDs.LINEA,
      CHAIN_IDs.LISK,
      CHAIN_IDs.MODE,
      CHAIN_IDs.OPTIMISM,
      CHAIN_IDs.PLASMA,
      CHAIN_IDs.SCROLL,
      CHAIN_IDs.SOLANA,
      CHAIN_IDs.SONEIUM,
      CHAIN_IDs.WORLD_CHAIN,
      CHAIN_IDs.ZK_SYNC,
      CHAIN_IDs.ZORA,
    ],
    fromSymbol: ["USDT*"],
    toChainId: [CHAIN_IDs.HYPERCORE],
    toSymbol: ["USDC-SPOT"],
  },
  {
    fromChainId: [CHAIN_IDs.SOLANA],
    fromSymbol: ["USDC"],
    toChainId: [CHAIN_IDs.HYPERCORE],
    toSymbol: ["USDT-SPOT"],
  },
  // Only USDC can be bridged to USDH on HyperEVM
  {
    fromChainId: "*",
    fromSymbol: ["!USDC"],
    toChainId: [CHAIN_IDs.HYPEREVM],
    toSymbol: ["USDH"],
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

export function isReverseRouteRestricted(params: {
  originToken: EnrichedToken | null;
  destinationToken: EnrichedToken | null;
}): boolean {
  const originToken = params.destinationToken;
  const destinationToken = params.originToken;
  if (!originToken || !destinationToken) return false;
  return isTokenUnreachable(destinationToken, false, originToken);
}
