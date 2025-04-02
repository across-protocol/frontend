import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "@across-protocol/constants";
import { writeFileSync } from "fs";
import * as prettier from "prettier";
import { ethers } from "ethers";

import {
  enabledMainnetChainConfigs,
  enabledSepoliaChainConfigs,
} from "./generate-routes";

const enabledSwapRoutes: {
  [hubPoolChainId: number]: {
    [tokenInSymbol: string]: {
      all?: {
        enabledDestinationChains: number[];
        enabledOutputTokens: string[];
      };
      [originChainId: number]: {
        enabledDestinationChains: number[];
        enabledOutputTokens: string[];
      };
    };
  };
} = {
  [CHAIN_IDs.MAINNET]: {
    [TOKEN_SYMBOLS_MAP.GHO.symbol]: {
      [CHAIN_IDs.MAINNET]: {
        enabledDestinationChains: [CHAIN_IDs.LENS],
        enabledOutputTokens: ["GHO"],
      },
      [CHAIN_IDs.LENS]: {
        enabledDestinationChains: [CHAIN_IDs.MAINNET],
        enabledOutputTokens: ["WGHO", "GHO", "USDC", "USDT", "DAI"],
      },
    },
    [TOKEN_SYMBOLS_MAP.WGHO.symbol]: {
      [CHAIN_IDs.MAINNET]: {
        enabledDestinationChains: [CHAIN_IDs.LENS],
        enabledOutputTokens: ["GHO"],
      },
    },
    // TODO: Enable if Uniswap SDK supports Lens
    // [TOKEN_SYMBOLS_MAP.USDC.symbol]: {
    //   all: {
    //     enabledDestinationChains: [CHAIN_IDs.LENS],
    //     enabledOutputTokens: ["GHO"],
    //   },
    // },
    // [TOKEN_SYMBOLS_MAP.USDT.symbol]: {
    //   all: {
    //     enabledDestinationChains: [CHAIN_IDs.LENS],
    //     enabledOutputTokens: ["GHO"],
    //   },
    // },
    // [TOKEN_SYMBOLS_MAP.DAI.symbol]: {
    //   all: {
    //     enabledDestinationChains: [CHAIN_IDs.LENS],
    //     enabledOutputTokens: ["GHO"],
    //   },
    // },
  },
  [CHAIN_IDs.SEPOLIA]: {},
} as const;

async function generateSwapRoutes(hubPoolChainId = 1) {
  const enabledChains =
    hubPoolChainId === 1
      ? enabledMainnetChainConfigs
      : enabledSepoliaChainConfigs;

  const swapRoutes: any[] = [];

  for (const [inputTokenSymbol, configPerOriginChain] of Object.entries(
    enabledSwapRoutes[hubPoolChainId]
  )) {
    for (const [originChainId, config] of Object.entries(
      configPerOriginChain
    )) {
      const { enabledDestinationChains, enabledOutputTokens } = config;

      const originChains =
        originChainId === "all"
          ? enabledChains
          : enabledChains.filter(
              (chain) => Number(originChainId) === chain.chainId
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
              throw new Error(
                `No token info for 'inputToken' or 'outputToken'`
              );
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
  }

  writeFileSync(
    `./src/data/universal-swap-routes_${hubPoolChainId}.json`,
    await prettier.format(JSON.stringify(swapRoutes, null, 2), {
      parser: "json",
    })
  );
}

generateSwapRoutes(Number(process.argv[2])).catch(console.error);
