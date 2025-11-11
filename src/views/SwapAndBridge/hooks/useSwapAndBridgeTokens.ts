import { useQuery } from "@tanstack/react-query";
import { useSwapTokens } from "hooks/useSwapTokens";
import { LifiToken, RouteFilterParams } from "./useAvailableCrosschainRoutes";
import useBridgeRoutes from "./useBridgeRoutes";
import { useUserTokenBalances } from "../../../hooks/useUserTokenBalances";
import { compareAddressesSimple } from "utils";
import { BigNumber, utils } from "ethers";

/**
 * Helper function to check if two tokens match by address, symbol, and chainId.
 * Used for deduplication when merging swap and bridge tokens.
 */
type BasicToken = Pick<LifiToken, "address" | "chainId" | "symbol">;

function tokensMatch(token1: BasicToken, token2: BasicToken): boolean {
  return (
    compareAddressesSimple(token1.address, token2.address) &&
    token1.symbol === token2.symbol &&
    token1.chainId === token2.chainId
  );
}

/**
 * Token type that includes user balances.
 * Used in components that need tokens with balance information but don't need unreachability status.
 */
export type TokenWithBalance = LifiToken & {
  /** User's token balance as a BigNumber */
  balance: BigNumber;
  /** User's token balance in USD */
  balanceUsd: number;
  /** Optional external project ID (e.g., for bridge routes) */
  externalProjectId?: string;
};

/**
 * Extended token type that includes unreachability status and user balances.
 * This is the return type for tokens from useSwapAndBridgeTokens.
 */
export type InputToken = TokenWithBalance & {
  /** Whether this token is unreachable given the current filter parameters */
  isUnreachable: boolean;
};

/**
 * Parameters for filtering tokens in useSwapAndBridgeTokens.
 * Extends RouteFilterParams with flags to indicate whether we're fetching input or output tokens.
 */
type Params = RouteFilterParams & {
  /**
   * If true, fetches input tokens (tokens that can be used as input for a route).
   * When set, useBridgeRoutes will filter to only input tokens that can reach the specified outputToken.
   */
  isInput?: boolean;
  /**
   * If true, fetches output tokens (tokens that can be received from a route).
   * When set, useBridgeRoutes will filter to only output tokens that can be reached from the specified inputToken.
   */
  isOutput?: boolean;
};

/**
 * Hook that merges swap and bridge tokens, enriches them with balances, and marks unreachable tokens.
 *
 * This hook performs the following operations:
 * 1. Fetches tokens from both swap pools (via useSwapTokens) and bridge routes (via useBridgeRoutes)
 * 2. Merges and deduplicates tokens that exist in both pools
 * 3. Marks tokens as unreachable based on:
 *    - Same chain check: tokens on the same chain as the other selected token
 *    - Bridge-only check: swap-only tokens when the output token is bridge-only
 * 4. Enriches tokens with user balances from useUserTokenBalances
 *
 * @param filterParams - Optional parameters to filter tokens:
 *   - `inputToken`: When selecting output tokens, filters to tokens reachable from this input token
 *   - `outputToken`: When selecting input tokens, filters to tokens that can reach this output token
 *   - `isInput`: Set to true when fetching input tokens (e.g., in origin token selector)
 *   - `isOutput`: Set to true when fetching output tokens (e.g., in destination token selector)
 *
 * @returns A React Query result containing:
 *   - `data`: Record<number, InputToken[]> - Tokens grouped by chainId
 *   - Standard React Query properties: `isLoading`, `isError`, `error`, etc.
 *
 * @example
 * // Fetch input tokens when USDC on HyperCore is selected as output
 * const { data: inputTokens } = useSwapAndBridgeTokens({
 *   outputToken: { chainId: 1337, address: "0x...", symbol: "USDC" },
 *   isInput: true,
 * });
 * // inputTokens[1] would contain all input tokens on chain 1
 * // Swap-only tokens will be marked as isUnreachable: true
 *
 * @example
 * // Fetch output tokens when USDC on Ethereum is selected as input
 * const { data: outputTokens } = useSwapAndBridgeTokens({
 *   inputToken: { chainId: 1, address: "0x...", symbol: "USDC" },
 *   isOutput: true,
 * });
 * // outputTokens[1337] would contain all output tokens on HyperCore
 * // Tokens on the same chain as input (chain 1) will be marked as isUnreachable: true
 */
export function useSwapAndBridgeTokens(filterParams?: Params) {
  const swapTokensQuery = useSwapTokens();
  const { query: bridgeTokensQuery } = useBridgeRoutes(filterParams);
  const tokenBalances = useUserTokenBalances();

  return useQuery({
    queryKey: ["inputTokens", filterParams, tokenBalances.data],
    queryFn: () => {
      const swapTokens = swapTokensQuery.data || [];

      // Get bridge tokens based on whether we're fetching input or output tokens
      const bridgeTokensByChain = filterParams?.isInput
        ? bridgeTokensQuery.data?.inputTokensByChain
        : bridgeTokensQuery.data?.outputTokensByChain;

      /**
       * Step 1: Build swapTokensByChain
       * Transform swap tokens from the API format (with addresses object) into a structure
       * organized by chainId. Each swap token can exist on multiple chains.
       */
      const swapTokensByChain = swapTokens.reduce(
        (acc, token) => {
          // Get the chainId from the addresses record (TokenInfo has addresses object)
          const chainIds = token.addresses
            ? Object.keys(token.addresses).map(Number)
            : [];

          chainIds.forEach((chainId) => {
            const address = token.addresses?.[chainId];
            if (!address) return;

            const mapped: LifiToken = {
              chainId: chainId,
              address: address,
              name: token.name,
              symbol: token.symbol,
              decimals: token.decimals,
              logoURI: token.logoURI || "",
              priceUSD: token.priceUsd || "0", // Use price from SwapToken, fallback to "0" if not available
              coinKey: token.symbol,
              routeSource: ["swap"],
            };

            if (!acc[chainId]) {
              acc[chainId] = [];
            }
            acc[chainId].push(mapped);
          });

          return acc;
        },
        {} as Record<number, Array<LifiToken>>
      );

      /**
       * Convert bridgeTokensByChain from string keys to number keys
       * useBridgeRoutes returns chainIds as strings, but we need them as numbers for consistency
       */
      const bridgeTokensByChainNumbered: Record<number, Array<LifiToken>> = {};
      if (bridgeTokensByChain) {
        Object.keys(bridgeTokensByChain).forEach((chainIdStr) => {
          const chainId = Number(chainIdStr);
          bridgeTokensByChainNumbered[chainId] =
            bridgeTokensByChain[chainIdStr];
        });
      }

      /**
       * Step 2: Merge and deduplicate tokens
       * Some tokens exist in both swap and bridge pools. We merge them by:
       * - Preferring swap token data (has price information)
       * - Combining routeSource arrays (e.g., ["bridge", "swap"])
       * - Using tokensMatch to identify duplicates
       */
      const mergedTokensByChain: Record<number, Array<InputToken>> = {};
      const allChainIds = new Set([
        ...Object.keys(swapTokensByChain).map(Number),
        ...Object.keys(bridgeTokensByChainNumbered).map(Number),
      ]);

      allChainIds.forEach((chainId) => {
        const swapTokensForChain = swapTokensByChain[chainId] || [];
        const bridgeTokensForChain = bridgeTokensByChainNumbered[chainId] || [];
        const merged: InputToken[] = [];

        // Process swap tokens first (they have price data)
        swapTokensForChain.forEach((swapToken) => {
          // Check if there's a matching bridge token
          const matchingBridgeToken = bridgeTokensForChain.find((bt) =>
            tokensMatch(swapToken, bt)
          );

          if (matchingBridgeToken) {
            // Token exists in both pools - merge them
            merged.push({
              ...swapToken, // Prefer swap token data (has price)
              routeSource: ["bridge", "swap"], // Combine route sources
              isUnreachable: false, // Will be set in step 3
              balance: BigNumber.from(0), // Will be set in step 4
              balanceUsd: 0, // Will be set in step 4
            });
          } else {
            // Token only in swap pool
            merged.push({
              ...swapToken,
              isUnreachable: false, // Will be set in step 3
              balance: BigNumber.from(0), // Will be set in step 4
              balanceUsd: 0, // Will be set in step 4
            });
          }
        });

        // Process bridge tokens that weren't already merged
        bridgeTokensForChain.forEach((bridgeToken) => {
          const alreadyMerged = merged.some((mt) =>
            tokensMatch(mt, bridgeToken)
          );
          if (!alreadyMerged) {
            merged.push({
              ...bridgeToken,
              isUnreachable: false, // Will be set in step 3
              balance: BigNumber.from(0), // Will be set in step 4
              balanceUsd: 0, // Will be set in step 4
            });
          }
        });

        mergedTokensByChain[chainId] = merged;
      });

      /**
       * Step 3: Mark tokens as unreachable
       * Tokens are marked unreachable in two scenarios:
       * 1. Same chain: tokens on the same chain as the other selected token (can't bridge to/from same chain)
       * 2. Bridge-only output: when output token is bridge-only, swap-only input tokens are unreachable
       */
      const outputTokenChainId = filterParams?.outputToken?.chainId;
      const inputTokenChainId = filterParams?.inputToken?.chainId;
      const outputToken = filterParams?.outputToken;

      /**
       * Check if output token is bridge-only (not available in swap token pool).
       * This is used to determine if swap-only input tokens should be marked as unreachable.
       */
      let isOutputTokenBridgeOnly = false;
      if (outputToken) {
        // Check if output token exists in swap tokens
        const outputTokenInSwap = swapTokens.some((st) => {
          const chainIds = st.addresses
            ? Object.keys(st.addresses).map(Number)
            : [];
          return (
            chainIds.includes(outputToken.chainId) &&
            st.addresses?.[outputToken.chainId] &&
            compareAddressesSimple(
              st.addresses[outputToken.chainId],
              outputToken.address
            ) &&
            st.symbol === outputToken.symbol
          );
        });

        // If output token is not in swap tokens, check if it's reachable via bridge routes
        if (!outputTokenInSwap && bridgeTokensQuery.data) {
          // When outputToken is set in filterParams, useBridgeRoutes filters inputTokens
          // to only those that can bridge to that outputToken. So if there are any
          // inputTokens, it means the outputToken is reachable via bridge routes.
          const bridgeInputTokens = bridgeTokensQuery.data.inputTokens || [];
          const hasBridgeRoutesToOutput = bridgeInputTokens.length > 0;

          // Also check if the outputToken exists in the outputTokens list
          // (this handles the case where outputToken might be in the list even if no inputToken is set)
          const bridgeOutputTokens = bridgeTokensQuery.data.outputTokens || [];
          const outputTokenInBridgeList = bridgeOutputTokens.find(
            (bt) =>
              bt.chainId === outputToken.chainId &&
              compareAddressesSimple(bt.address, outputToken.address) &&
              bt.symbol === outputToken.symbol
          );

          // If there are bridge routes to this output token (indicated by inputTokens existing),
          // or if the outputToken is in the bridge outputTokens list, it's bridge-only
          isOutputTokenBridgeOnly =
            hasBridgeRoutesToOutput || !!outputTokenInBridgeList;
        }
      }

      Object.keys(mergedTokensByChain).forEach((chainIdStr) => {
        const chainId = Number(chainIdStr);
        mergedTokensByChain[chainId] = mergedTokensByChain[chainId].map(
          (token) => {
            let isUnreachable = false;

            // (same chain check)
            // When selecting input tokens: mark tokens on the same chain as outputToken as unreachable
            // When selecting output tokens: mark tokens on the same chain as inputToken as unreachable
            if (
              filterParams?.isInput &&
              outputTokenChainId &&
              token.chainId === outputTokenChainId
            ) {
              isUnreachable = true;
            } else if (
              filterParams?.isOutput &&
              inputTokenChainId &&
              token.chainId === inputTokenChainId
            ) {
              isUnreachable = true;
            }

            // (bridge only check)
            // If outputToken is bridge only, mark all swap-only input tokens as unreachable
            // This only applies when selecting input tokens (isInput: true)
            if (
              filterParams?.isInput &&
              isOutputTokenBridgeOnly &&
              token.routeSource.includes("swap") &&
              !token.routeSource.includes("bridge")
            ) {
              // Token is swap-only and output is bridge-only
              isUnreachable = true;
            }

            return {
              ...token,
              isUnreachable,
            };
          }
        );
      });

      /**
       * Step 4: Enrich tokens with user balances
       * For each token, find the corresponding balance from useUserTokenBalances and calculate:
       * - balance: BigNumber representation of the token balance
       * - balanceUsd: USD value of the balance (balance * priceUSD)
       */
      const TokenWithBalancesByChain: Record<number, Array<InputToken>> = {};
      Object.keys(mergedTokensByChain).forEach((chainIdStr) => {
        const chainId = Number(chainIdStr);
        const balancesForChain = tokenBalances.data?.balances.find(
          (t) => t.chainId === String(chainId)
        );

        const tokens = mergedTokensByChain[chainId];
        const TokenWithBalances = tokens.map((t) => {
          const balance = balancesForChain?.balances.find((b) =>
            compareAddressesSimple(b.address, t.address)
          );
          return {
            ...t,
            balance: balance?.balance
              ? BigNumber.from(balance.balance)
              : BigNumber.from(0),
            balanceUsd:
              balance?.balance && t
                ? Number(
                    utils.formatUnits(
                      BigNumber.from(balance.balance),
                      t.decimals
                    )
                  ) * Number(t.priceUSD)
                : 0,
          };
        });

        TokenWithBalancesByChain[chainId] = TokenWithBalances;
      });

      /**
       * Step 5: Return enriched tokens grouped by chainId
       * The result is a Record where keys are chainIds (numbers) and values are arrays of InputToken
       */
      return TokenWithBalancesByChain;
    },
    /**
     * Query is enabled when:
     * - Swap tokens are successfully loaded (required for merging)
     * - Bridge routes query has completed (success or error - error means no bridge routes available)
     * - Token balances query has completed (success or error - error means no balances available)
     */
    enabled:
      swapTokensQuery.isSuccess &&
      (bridgeTokensQuery.isSuccess || bridgeTokensQuery.isError) &&
      (tokenBalances.isSuccess || tokenBalances.isError),
  });
}
