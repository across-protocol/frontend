import { useQuery } from "@tanstack/react-query";
import { useSwapTokens } from "hooks/useSwapTokens";
import { LifiToken, RouteFilterParams } from "./useAvailableCrosschainRoutes";
import useBridgeRoutes from "./useBridgeRoutes";
import { useUserTokenBalances } from "../../../hooks/useUserTokenBalances";
import { compareAddressesSimple } from "utils";
import { BigNumber, utils } from "ethers";
import { useEffect } from "react";

type BasicToken = Pick<LifiToken, "address" | "chainId" | "symbol">;

function tokensMatch(token1: BasicToken, token2: BasicToken): boolean {
  return (
    compareAddressesSimple(token1.address, token2.address) &&
    token1.symbol === token2.symbol &&
    token1.chainId === token2.chainId
  );
}

export type InputToken = LifiToken & {
  isUnreachable: boolean;
  balance: BigNumber;
  balanceUsd: number;
};

type Params = RouteFilterParams & {
  isInput?: boolean;
  isOutput?: boolean;
};

export function useSwapAndBridgeTokens(filterParams?: Params) {
  const swapTokensQuery = useSwapTokens();
  const { query: bridgeTokensQuery } = useBridgeRoutes(filterParams);
  const tokenBalances = useUserTokenBalances();

  useEffect(() => {
    console.log("bridge input tokens", bridgeTokensQuery.data?.inputTokens);
  }, [bridgeTokensQuery.data?.inputTokens]);

  useEffect(() => {
    console.log("bridge output tokens", bridgeTokensQuery.data?.outputTokens);
  }, [bridgeTokensQuery.data?.outputTokens]);

  return useQuery({
    queryKey: ["inputTokens", filterParams, tokenBalances.data],
    queryFn: () => {
      const swapTokens = swapTokensQuery.data || [];

      const bridgeTokensByChain = filterParams?.isInput
        ? bridgeTokensQuery.data?.inputTokensByChain
        : bridgeTokensQuery.data?.outputTokensByChain;

      // step 1 => build swapTokensByChain
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

      // Convert bridgeTokensByChain from string keys to number keys
      const bridgeTokensByChainNumbered: Record<number, Array<LifiToken>> = {};
      if (bridgeTokensByChain) {
        Object.keys(bridgeTokensByChain).forEach((chainIdStr) => {
          const chainId = Number(chainIdStr);
          bridgeTokensByChainNumbered[chainId] =
            bridgeTokensByChain[chainIdStr];
        });
      }

      // step 2 => merge and dedupe
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

      // step 3 => Mark isUnreachable
      const outputTokenChainId = filterParams?.outputToken?.chainId;
      const inputTokenChainId = filterParams?.inputToken?.chainId;
      const outputToken = filterParams?.outputToken;

      // Check if output token is bridge only (i.e., not available in swap token pool)
      // If output token exists in bridge routes but not in swap tokens, it's bridge-only
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

      // step 4 => enrich tokens with balances
      const enrichedTokensByChain: Record<number, Array<InputToken>> = {};
      Object.keys(mergedTokensByChain).forEach((chainIdStr) => {
        const chainId = Number(chainIdStr);
        const balancesForChain = tokenBalances.data?.balances.find(
          (t) => t.chainId === String(chainId)
        );

        const tokens = mergedTokensByChain[chainId];
        const enrichedTokens = tokens.map((t) => {
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

        enrichedTokensByChain[chainId] = enrichedTokens;
      });

      // step 5 => return enriched tokens by chain
      return enrichedTokensByChain;
    },
    enabled:
      swapTokensQuery.isSuccess &&
      (bridgeTokensQuery.isSuccess || bridgeTokensQuery.isError) &&
      (tokenBalances.isSuccess || tokenBalances.isError),
  });
}
