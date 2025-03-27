import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "@across-protocol/constants";
import { writeFileSync } from "fs";
import * as prettier from "prettier";
import { ethers } from "ethers";

import {
  enabledMainnetChainConfigs,
  enabledSepoliaChainConfigs,
} from "./generate-routes";

const enabledSwapRoutes = {
  [CHAIN_IDs.MAINNET]: {
    [TOKEN_SYMBOLS_MAP.GHO.symbol]: {
      enabledOriginChains: [CHAIN_IDs.MAINNET, CHAIN_IDs.LENS],
      enabledDestinationChains: [CHAIN_IDs.MAINNET, CHAIN_IDs.LENS],
      enabledOutputTokens: ["WGHO", "USDC", "USDT", "DAI"],
    },
    [TOKEN_SYMBOLS_MAP.USDC.symbol]: {
      enabledOriginChains: "all",
      enabledDestinationChains: [CHAIN_IDs.MAINNET],
      enabledOutputTokens: ["GHO"],
    },
    [TOKEN_SYMBOLS_MAP.USDT.symbol]: {
      enabledOriginChains: "all",
      enabledDestinationChains: [CHAIN_IDs.MAINNET],
      enabledOutputTokens: ["GHO"],
    },
    [TOKEN_SYMBOLS_MAP.DAI.symbol]: {
      enabledOriginChains: "all",
      enabledDestinationChains: [CHAIN_IDs.MAINNET],
      enabledOutputTokens: ["GHO"],
    },
    [TOKEN_SYMBOLS_MAP["USDC.e"].symbol]: {
      enabledOriginChains: [CHAIN_IDs.ARBITRUM],
      enabledDestinationChains: [CHAIN_IDs.OPTIMISM, CHAIN_IDs.MAINNET],
      enabledOutputTokens: ["USDC", "ETH", "WETH", "GHO"],
    },
    [TOKEN_SYMBOLS_MAP.ETH.symbol]: {
      enabledOriginChains: [CHAIN_IDs.ARBITRUM],
      enabledDestinationChains: [CHAIN_IDs.OPTIMISM],
      enabledOutputTokens: ["USDC"],
    },
    [TOKEN_SYMBOLS_MAP.WETH.symbol]: {
      enabledOriginChains: [CHAIN_IDs.ARBITRUM],
      enabledDestinationChains: [CHAIN_IDs.OPTIMISM],
      enabledOutputTokens: ["USDC"],
    },
  },
  [CHAIN_IDs.SEPOLIA]: {},
} as const;

async function generateSwapRoutes(hubPoolChainId = 1) {
  const enabledChains =
    hubPoolChainId === 1
      ? enabledMainnetChainConfigs
      : enabledSepoliaChainConfigs;

  const swapRoutes: any[] = [];

  for (const [inputTokenSymbol, config] of Object.entries(
    enabledSwapRoutes[hubPoolChainId]
  )) {
    const {
      enabledOriginChains,
      enabledDestinationChains,
      enabledOutputTokens,
    } = config;

    const originChains =
      enabledOriginChains === "all"
        ? enabledChains
        : enabledChains.filter((chain) =>
            enabledOriginChains.includes(chain.chainId)
          );
    const destinationChains = enabledChains.filter((chain) =>
      enabledDestinationChains.includes(chain.chainId)
    );

    for (const originChain of originChains) {
      const originChainHasInputToken =
        TOKEN_SYMBOLS_MAP[inputTokenSymbol as keyof typeof TOKEN_SYMBOLS_MAP]
          .addresses[originChain.chainId] !== undefined;

      if (!originChainHasInputToken) {
        console.warn(
          `Origin chain ${originChain.chainId} does not have input token ${inputTokenSymbol}. Skipping...`
        );
        continue;
      }

      const relevantDestinationChains = destinationChains.filter(
        (chain) => chain.chainId !== originChain.chainId
      );

      // Check for each enabled destination chain if enabled output token exists
      for (const destinationChain of relevantDestinationChains) {
        for (const outputTokenSymbol of enabledOutputTokens) {
          const destinationChainHasOutputToken =
            TOKEN_SYMBOLS_MAP[
              outputTokenSymbol as keyof typeof TOKEN_SYMBOLS_MAP
            ].addresses[destinationChain.chainId] !== undefined;

          if (!destinationChainHasOutputToken) {
            console.warn(
              `Destination chain ${destinationChain.chainId} does not have output token ${outputTokenSymbol}. Skipping...`
            );
            continue;
          }

          const inputToken =
            TOKEN_SYMBOLS_MAP[
              inputTokenSymbol as keyof typeof TOKEN_SYMBOLS_MAP
            ];
          const outputToken =
            TOKEN_SYMBOLS_MAP[
              outputTokenSymbol as keyof typeof TOKEN_SYMBOLS_MAP
            ];
          if (!inputToken || !outputToken) {
            throw new Error(`No token info for 'inputToken' or 'outputToken'`);
          }

          const swapRoute = {
            fromChain: originChain.chainId,
            toChain: destinationChain.chainId,
            fromTokenAddress:
              originChain.nativeToken === inputToken.symbol
                ? ethers.constants.AddressZero
                : inputToken.addresses[originChain.chainId],
            toTokenAddress:
              destinationChain.nativeToken === outputToken.symbol
                ? ethers.constants.AddressZero
                : outputToken.addresses[destinationChain.chainId],
            fromTokenSymbol: inputToken.symbol,
            toTokenSymbol: outputToken.symbol,
            fromSpokeAddress: originChain.spokePool.address,
            l1TokenAddress: inputToken.addresses[hubPoolChainId],
            type: "universal-swap",
            isNative:
              originChain.nativeToken === inputToken.symbol &&
              destinationChain.nativeToken === outputToken.symbol,
          };

          const doesExist = swapRoutes.some(
            (route) =>
              route.fromChain === swapRoute.fromChain &&
              route.toChain === swapRoute.toChain &&
              route.fromTokenSymbol === swapRoute.fromTokenSymbol &&
              route.toTokenSymbol === swapRoute.toTokenSymbol
          );

          if (doesExist) {
            continue;
          }

          swapRoutes.push(swapRoute);
        }
      }
    }
  }

  writeFileSync(
    `./src/data/universal-swap-routes_${hubPoolChainId}.json`,
    await prettier.format(JSON.stringify(swapRoutes, null, 2), {
      parser: "json",
    })
  );
}

generateSwapRoutes(Number(process.argv[2])).catch(console.error);
