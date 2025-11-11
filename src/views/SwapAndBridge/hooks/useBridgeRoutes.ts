import { useQuery } from "@tanstack/react-query";
import { TOKEN_SYMBOLS_MAP, CHAIN_IDs } from "@across-protocol/constants";
import { LifiToken, RouteFilterParams } from "./useAvailableCrosschainRoutes";
import { orderedTokenLogos } from "constants/tokens";
import unknownLogo from "assets/icons/question-circle.svg";
import { compareAddressesSimple, getConfig, getToken } from "utils";
import { constants } from "ethers";

export type Route = {
  fromChain: number;
  toChain: number;
  fromTokenAddress: string;
  toTokenAddress: string;
  fromTokenSymbol: string;
  toTokenSymbol: string;
  isNative: boolean;
  l1TokenAddress: string;
  externalProjectId?: string;
};

export type BridgeRoutesResult = {
  routes: Route[];
  inputTokens: LifiToken[];
  outputTokens: LifiToken[];
  allTokens: LifiToken[];
  inputTokensByChain: Record<string, LifiToken[]>;
  outputTokensByChain: Record<string, LifiToken[]>;
};

const config = getConfig();

export default function useBridgeRoutes(filterParams?: RouteFilterParams) {
  const query = useQuery<BridgeRoutesResult>({
    queryKey: ["bridgeRoutes", filterParams],
    queryFn: async () => {
      const routesData = config.getEnabledRoutes();

      // Filter routes that have externalProjectId
      let filteredRoutes = routesData.filter(
        (route) => route.externalProjectId
      );

      // Helper function to get the effective chainId for a route token
      // This accounts for HyperCore mapping where hyperliquid routes map to HYPERCORE
      const getEffectiveChainId = (
        route: Route,
        isInputToken: boolean
      ): number => {
        if (isInputToken) {
          return route.fromChain;
        }
        // For output tokens, if it's a hyperliquid route, use HYPERCORE chainId
        return route.externalProjectId === "hyperliquid"
          ? CHAIN_IDs.HYPERCORE
          : route.toChain;
      };

      // Helper function to create a token from route data
      const createTokenFromRoute = (
        route: Route,
        isInputToken: boolean
      ): LifiToken | null => {
        const tokenSymbol = isInputToken
          ? route.fromTokenSymbol
          : route.toTokenSymbol;
        const tokenInfo = getToken(tokenSymbol);
        if (!tokenInfo) return null;

        const chainId = getEffectiveChainId(route, isInputToken);

        const address = isInputToken
          ? route.isNative
            ? constants.AddressZero
            : route.fromTokenAddress
          : route.toTokenAddress;

        return {
          chainId,
          address,
          symbol: tokenSymbol,
          name: tokenInfo.name,
          decimals: tokenInfo.decimals,
          logoURI: tokenInfo.logoURI,
          priceUSD: "0", // TODO
          coinKey: tokenSymbol,
          routeSource: ["bridge"],
          // externalProjectId: route.externalProjectId,
        };
      };

      // Build input tokens: if outputToken is set, return tokens that can bridge to it
      // Otherwise, return all unique input tokens
      const inputTokenMap = new Map<string, LifiToken>();

      const routesForInputTokens = filterParams?.outputToken
        ? filteredRoutes.filter((route) => {
            // Use effective chainId for output token comparison
            const effectiveOutputChainId = getEffectiveChainId(route, false);
            return (
              effectiveOutputChainId === filterParams.outputToken?.chainId &&
              compareAddressesSimple(
                route.toTokenAddress,
                filterParams.outputToken?.address
              ) &&
              route.toTokenSymbol === filterParams.outputToken?.symbol
            );
          })
        : filteredRoutes;

      routesForInputTokens.forEach((route) => {
        const token = createTokenFromRoute(route, true);
        if (token) {
          const key = `${token.chainId}-${token.address.toLowerCase()}-${token.symbol}`;
          if (!inputTokenMap.has(key)) {
            inputTokenMap.set(key, token);
          }
        }
      });

      // Build output tokens: if inputToken is set, return tokens that can be reached from it
      // Otherwise, return all unique output tokens
      const outputTokenMap = new Map<string, LifiToken>();

      const routesForOutputTokens = filterParams?.inputToken
        ? filteredRoutes.filter(
            (route) =>
              route.fromChain === filterParams.inputToken?.chainId &&
              compareAddressesSimple(
                route.fromTokenAddress,
                filterParams.inputToken?.address
              ) &&
              route.fromTokenSymbol === filterParams.inputToken?.symbol
          )
        : filteredRoutes;

      routesForOutputTokens.forEach((route) => {
        const token = createTokenFromRoute(route, false);
        if (token) {
          // For HyperCore, deduplicate by symbol only (since all hyperliquid routes have the same destination token)
          // For other chains, deduplicate by chainId + address + symbol
          const key =
            token.chainId === CHAIN_IDs.HYPERCORE
              ? `${token.chainId}-${token.symbol}`
              : `${token.chainId}-${token.address.toLowerCase()}-${token.symbol}`;
          if (!outputTokenMap.has(key)) {
            outputTokenMap.set(key, token);
          }
        }
      });

      const inputTokens = Array.from(inputTokenMap.values());
      const outputTokens = Array.from(outputTokenMap.values());

      // Group tokens by chainId for inputTokensByChain
      const inputTokensByChain = inputTokens.reduce(
        (acc, token) => {
          const chainId = String(token.chainId);
          if (!acc[chainId]) {
            acc[chainId] = [];
          }
          acc[chainId].push(token);
          return acc;
        },
        {} as Record<string, LifiToken[]>
      );

      // Group tokens by chainId for outputTokensByChain
      const outputTokensByChain = outputTokens.reduce(
        (acc, token) => {
          const chainId = String(token.chainId);
          if (!acc[chainId]) {
            acc[chainId] = [];
          }
          acc[chainId].push(token);
          return acc;
        },
        {} as Record<string, LifiToken[]>
      );

      return {
        routes: filteredRoutes,
        inputTokens,
        outputTokens,
        inputTokensByChain,
        outputTokensByChain,
        allTokens: [...inputTokens, ...outputTokens],
      };
    },
  });

  return {
    query,
    filterParams,
  };
}
