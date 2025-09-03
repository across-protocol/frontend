import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "@across-protocol/constants";
import { writeFileSync } from "fs";
import * as prettier from "prettier";
import { ethers } from "ethers";
import {
  enabledMainnetChainConfigs,
  enabledSepoliaChainConfigs,
} from "./utils/enabled-chain-configs";

const enabledSwapRoutes: {
  [hubPoolChainId: number]: {
    [tokenInSymbol: string]: {
      all?: {
        disabledOriginChains?: number[];
        enabledDestinationChains: "all" | number[];
        enabledOutputTokens: string[];
      };
      [originChainId: number]: {
        enabledDestinationChains: "all" | number[];
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
        enabledOutputTokens: ["GHO", "USDC", "USDT", "DAI"],
      },
    },
    [TOKEN_SYMBOLS_MAP.WGHO.symbol]: {
      [CHAIN_IDs.MAINNET]: {
        enabledDestinationChains: [CHAIN_IDs.LENS],
        enabledOutputTokens: ["GHO"],
      },
    },
    [TOKEN_SYMBOLS_MAP.USDC.symbol]: {
      all: {
        disabledOriginChains: [
          CHAIN_IDs.ALEPH_ZERO, // Not bridgeable
          CHAIN_IDs.LINEA, // Not bridgeable
          CHAIN_IDs.SOLANA, // Not available yet
        ],
        enabledDestinationChains: [CHAIN_IDs.LENS],
        enabledOutputTokens: ["GHO"],
      },
    },
    [TOKEN_SYMBOLS_MAP["USDC.e"].symbol]: {
      all: {
        disabledOriginChains: [CHAIN_IDs.MAINNET, CHAIN_IDs.ALEPH_ZERO],
        enabledDestinationChains: [CHAIN_IDs.LENS],
        enabledOutputTokens: ["GHO"],
      },
    },
    [TOKEN_SYMBOLS_MAP["USDbC"].symbol]: {
      all: {
        disabledOriginChains: [CHAIN_IDs.MAINNET],
        enabledDestinationChains: [CHAIN_IDs.LENS],
        enabledOutputTokens: ["GHO"],
      },
    },
    [TOKEN_SYMBOLS_MAP["USDzC"].symbol]: {
      all: {
        disabledOriginChains: [CHAIN_IDs.MAINNET],
        enabledDestinationChains: [CHAIN_IDs.LENS],
        enabledOutputTokens: ["GHO"],
      },
    },
    [TOKEN_SYMBOLS_MAP.USDT.symbol]: {
      [CHAIN_IDs.MAINNET]: {
        enabledDestinationChains: [CHAIN_IDs.LENS],
        enabledOutputTokens: ["GHO"],
      },
    },
    [TOKEN_SYMBOLS_MAP.DAI.symbol]: {
      [CHAIN_IDs.MAINNET]: {
        enabledDestinationChains: [CHAIN_IDs.LENS],
        enabledOutputTokens: ["GHO"],
      },
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

  for (const [inputTokenSymbol, configPerOriginChain] of Object.entries(
    enabledSwapRoutes[hubPoolChainId]
  )) {
    for (const [originChainId, config] of Object.entries(
      configPerOriginChain
    )) {
      const {
        enabledDestinationChains,
        enabledOutputTokens,
        disabledOriginChains = [],
      } = {
        ...config,
        disabledOriginChains:
          originChainId === "all" ? (config as any).disabledOriginChains : [],
      };

      const originChains =
        originChainId === "all"
          ? enabledChains.filter(
              (chain) => !disabledOriginChains.includes(chain.chainId)
            )
          : enabledChains.filter(
              (chain) => Number(originChainId) === chain.chainId
            );
      const destinationChains = enabledChains.filter((chain) =>
        enabledDestinationChains === "all"
          ? true
          : enabledDestinationChains.includes(chain.chainId)
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

const hubPoolChainId = process.argv[2];
if (hubPoolChainId) {
  generateSwapRoutes(Number(hubPoolChainId));
} else {
  Object.keys(enabledSwapRoutes).forEach((chainId) => {
    generateSwapRoutes(Number(chainId));
  });
}
