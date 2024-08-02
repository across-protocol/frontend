import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "@across-protocol/constants";
import { utils as sdkUtils } from "@across-protocol/sdk";
import { utils } from "ethers";
import { writeFileSync } from "fs";
import * as prettier from "prettier";

import * as chainConfigs from "./chain-configs";

const { getDeployedAddress } = sdkUtils;

type Route =
  (typeof enabledRoutes)[keyof typeof enabledRoutes]["routes"][number];
type ToChain = Route["toChains"][number];
type ToToken = ToChain["tokens"][number];
type SwapToken = ToChain["swapTokens"][number];
type ValidTokenSymbol = string;

const enabledMainnetChainConfigs = [
  chainConfigs.MAINNET,
  chainConfigs.OPTIMISM,
  chainConfigs.POLYGON,
  chainConfigs.ARBITRUM,
  chainConfigs.ZK_SYNC,
  chainConfigs.BASE,
  chainConfigs.LINEA,
  chainConfigs.MODE,
  chainConfigs.BLAST,
  chainConfigs.LISK,
];

const enabledSepoliaChainConfigs = [
  chainConfigs.SEPOLIA,
  chainConfigs.BASE_SEPOLIA,
  chainConfigs.ARBITRUM_SEPOLIA,
  chainConfigs.OPTIMISM_SEPOLIA,
  chainConfigs.MODE_SEPOLIA,
  chainConfigs.POLYGON_AMOY,
  chainConfigs.BLAST_SEPOLIA,
  chainConfigs.LISK_SEPOLIA,
];

const enabledRoutes = {
  [CHAIN_IDs.MAINNET]: {
    hubPoolChain: CHAIN_IDs.MAINNET,
    hubPoolAddress: getDeployedAddress("HubPool", CHAIN_IDs.MAINNET),
    hubPoolWethAddress: TOKEN_SYMBOLS_MAP.WETH.addresses[CHAIN_IDs.MAINNET],
    acrossConfigStoreAddress: getDeployedAddress(
      "AcrossConfigStore",
      CHAIN_IDs.MAINNET
    ),
    acrossTokenAddress: TOKEN_SYMBOLS_MAP.ACX.addresses[CHAIN_IDs.MAINNET],
    acceleratingDistributorAddress:
      "0x9040e41eF5E8b281535a96D9a48aCb8cfaBD9a48",
    merkleDistributorAddress: "0xE50b2cEAC4f60E840Ae513924033E753e2366487",
    claimAndStakeAddress: "0x985e8A89Dd6Af8896Ef075c8dd93512433dc5829",
    pools: [
      {
        tokenSymbol: "BOBA",
        isNative: false,
      },
    ],
    spokePoolVerifier: {
      address: "0xB4A8d45647445EA9FC3E1058096142390683dBC2",
      enabledChains: [
        CHAIN_IDs.MAINNET,
        CHAIN_IDs.OPTIMISM,
        CHAIN_IDs.POLYGON,
        CHAIN_IDs.BASE,
        CHAIN_IDs.ARBITRUM,
        CHAIN_IDs.LINEA,
        CHAIN_IDs.MODE,
        CHAIN_IDs.BLAST,
        CHAIN_IDs.LISK,
      ],
    },
    swapAndBridgeAddresses: {
      "1inch": {
        [CHAIN_IDs.POLYGON]: "0xaBa0F11D55C5dDC52cD0Cb2cd052B621d45159d5",
        [CHAIN_IDs.OPTIMISM]: "0x3E7448657409278C9d6E192b92F2b69B234FCc42",
        [CHAIN_IDs.ARBITRUM]: "0xC456398D5eE3B93828252e48beDEDbc39e03368E",
        [CHAIN_IDs.BASE]: "0x7CFaBF2eA327009B39f40078011B0Fb714b65926",
      },
      uniswap: {
        [CHAIN_IDs.POLYGON]: "0x9220Fa27ae680E4e8D9733932128FA73362E0393",
        [CHAIN_IDs.OPTIMISM]: "0x6f4A733c7889f038D77D4f540182Dda17423CcbF",
        [CHAIN_IDs.ARBITRUM]: "0xF633b72A4C2Fb73b77A379bf72864A825aD35b6D",
        // [CHAIN_IDs.BASE]: "0xbcfbCE9D92A516e3e7b0762AE218B4194adE34b4",
      },
    },
    routes: transformChainConfigs(enabledMainnetChainConfigs),
  },
  [CHAIN_IDs.SEPOLIA]: {
    hubPoolChain: CHAIN_IDs.SEPOLIA,
    hubPoolAddress: getDeployedAddress("HubPool", CHAIN_IDs.SEPOLIA),
    hubPoolWethAddress: TOKEN_SYMBOLS_MAP.WETH.addresses[CHAIN_IDs.SEPOLIA],
    acrossConfigStoreAddress: getDeployedAddress(
      "AcrossConfigStore",
      CHAIN_IDs.SEPOLIA
    ),
    acrossTokenAddress: "0x49fCaC04AE71dbD074304Fb12071bD771e0E927A",
    acceleratingDistributorAddress:
      "0x3a202A5F5941b8b6b56EE24f8503aD31Fba18b05",
    merkleDistributorAddress: "0x711615993FD2b9D22b598f7b36B762eA89E9EC2b",
    claimAndStakeAddress: "0x765904d00BaAEF371ea1f6cfd41af19BbA644766",
    pools: [],
    spokePoolVerifier: {
      address: sdkUtils.AddressZero,
      enabledChains: [],
    },
    swapAndBridgeAddresses: {
      uniswap: {
        [CHAIN_IDs.BASE_SEPOLIA]: "0xf81C7cbC1196FACb327BD5B7021f9C1c220D0328", // Mocked
        [CHAIN_IDs.OPTIMISM_SEPOLIA]:
          "0x17496824Ba574A4e9De80110A91207c4c63e552a", // Mocked
      },
    },
    routes: transformChainConfigs(enabledSepoliaChainConfigs),
  },
} as const;

function transformChainConfigs(
  enabledChainConfigs: typeof enabledMainnetChainConfigs
) {
  const transformedChainConfigs: {
    fromChain: number;
    fromSpokeAddress: string;
    toChains: {
      chainId: number;
      tokens: (
        | string
        | {
            inputTokenSymbol: string;
            outputTokenSymbol: string;
          }
      )[];
      swapTokens: {
        swapInputTokenSymbol: string;
        acrossInputTokenSymbol: string;
        acrossOutputTokenSymbol: string;
      }[];
    }[];
  }[] = [];
  const enabledChainIds = enabledChainConfigs.map((config) => config.chainId);

  for (const chainConfig of enabledChainConfigs) {
    const fromChainId = chainConfig.chainId;
    const fromSpokeAddress = chainConfig.spokePool;
    const toChainIds = enabledChainIds.filter(
      (chainId) => chainId !== fromChainId
    );
    const toChains: {
      chainId: number;
      tokens: (
        | string
        | {
            inputTokenSymbol: string;
            outputTokenSymbol: string;
          }
      )[];
      swapTokens: {
        swapInputTokenSymbol: string;
        acrossInputTokenSymbol: string;
        acrossOutputTokenSymbol: string;
      }[];
    }[] = [];

    for (const toChainId of toChainIds) {
      const toChainConfig = enabledChainConfigs.find(
        (config) => config.chainId === toChainId
      );

      if (!toChainConfig) {
        throw new Error(`No config found for chain ${toChainId}`);
      }

      const tokens = chainConfig.tokens.flatMap((token) => {
        const tokenSymbol = typeof token === "string" ? token : token.symbol;

        // Handle USDC -> USDC.e/USDbC routes
        if (tokenSymbol === "USDC") {
          if (toChainConfig.enableCCTP) {
            return [
              "USDC",
              {
                inputTokenSymbol: "USDC",
                outputTokenSymbol: getBridgedUsdcSymbol(toChainConfig.chainId),
              },
            ];
          } else if (
            toChainConfig.tokens.includes("USDC.e") ||
            toChainConfig.tokens.includes("USDbC")
          ) {
            return [
              {
                inputTokenSymbol: "USDC",
                outputTokenSymbol: getBridgedUsdcSymbol(toChainConfig.chainId),
              },
            ];
          }
        }

        if (["USDC.e", "USDbC"].includes(tokenSymbol)) {
          if (toChainConfig.enableCCTP) {
            return [
              {
                inputTokenSymbol: tokenSymbol,
                outputTokenSymbol: "USDC",
              },
              {
                inputTokenSymbol: tokenSymbol,
                outputTokenSymbol: getBridgedUsdcSymbol(toChainConfig.chainId),
              },
            ];
          } else if (toChainConfig.tokens.includes("USDC")) {
            return [
              {
                inputTokenSymbol: tokenSymbol,
                outputTokenSymbol: "USDC",
              },
            ];
          }
        }

        // Handle USDB -> DAI
        if (tokenSymbol === "USDB" && toChainConfig.tokens.includes("DAI")) {
          return [
            {
              inputTokenSymbol: "USDB",
              outputTokenSymbol: "DAI",
            },
          ];
        }
        if (tokenSymbol === "DAI" && toChainConfig.tokens.includes("USDB")) {
          return [
            {
              inputTokenSymbol: "DAI",
              outputTokenSymbol: "USDB",
            },
          ];
        }

        // Handle WETH Polygon
        if (
          tokenSymbol === "WETH" &&
          [CHAIN_IDs.POLYGON, CHAIN_IDs.POLYGON_AMOY].includes(
            toChainConfig.chainId
          )
        ) {
          return ["WETH", "ETH"];
        }

        // Handle WETH <-> ETH
        if (tokenSymbol === "WETH") {
          return [
            "WETH",
            {
              inputTokenSymbol: "WETH",
              outputTokenSymbol: "ETH",
            },
          ];
        }
        if (tokenSymbol === "ETH") {
          return [
            "ETH",
            {
              inputTokenSymbol: "ETH",
              outputTokenSymbol: "WETH",
            },
          ];
        }

        const chainIds =
          typeof token === "string" ? [toChainId] : token.chainIds;

        const toToken = toChainConfig.tokens.find((token) =>
          typeof token === "string"
            ? token === tokenSymbol
            : token.symbol === tokenSymbol
        );
        if (
          !toToken ||
          (typeof toToken === "object" &&
            !toToken.chainIds.includes(fromChainId)) ||
          !chainIds.includes(toChainId)
        ) {
          return [];
        }

        return tokenSymbol;
      });

      const toChain = {
        chainId: toChainId,
        tokens,
        swapTokens: chainConfig.swapTokens.filter(
          ({ acrossInputTokenSymbol, acrossOutputTokenSymbol }) =>
            tokens.some((token) =>
              typeof token === "string"
                ? token === acrossInputTokenSymbol
                : token.inputTokenSymbol === acrossInputTokenSymbol
            ) &&
            tokens.some((token) =>
              typeof token === "string"
                ? token === acrossOutputTokenSymbol
                : token.outputTokenSymbol === acrossOutputTokenSymbol
            )
        ),
      };
      toChains.push(toChain);
    }

    transformedChainConfigs.push({
      fromChain: fromChainId,
      fromSpokeAddress,
      toChains,
    });
  }

  return transformedChainConfigs;
}

async function generateRoutes(hubPoolChainId = 1) {
  const config = enabledRoutes[hubPoolChainId];

  if (!config) {
    throw new Error("Hub pool chain not supported");
  }

  const routeFileContent = {
    hubPoolChain: config.hubPoolChain,
    hubPoolAddress: utils.getAddress(config.hubPoolAddress),
    hubPoolWethAddress: utils.getAddress(config.hubPoolWethAddress),
    acrossConfigStoreAddress: utils.getAddress(config.acrossConfigStoreAddress),
    acrossTokenAddress: utils.getAddress(config.acrossTokenAddress),
    acceleratingDistributorAddress: utils.getAddress(
      config.acceleratingDistributorAddress
    ),
    merkleDistributorAddress: utils.getAddress(config.merkleDistributorAddress),
    claimAndStakeAddress: utils.getAddress(config.claimAndStakeAddress),
    swapAndBridgeAddresses: Object.entries(
      config.swapAndBridgeAddresses
    ).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: Object.entries(value).reduce(
          (acc, [chainId, address]) => ({
            ...acc,
            [chainId]: utils.getAddress(address as string),
          }),
          {}
        ),
      }),
      {}
    ),
    routes: config.routes.flatMap((route) =>
      transformBridgeRoute(route, config.hubPoolChain)
    ),
    swapRoutes: config.routes.flatMap((route) =>
      transformSwapRoute(route, config.hubPoolChain)
    ),
    pools: config.pools,
    spokePoolVerifier: config.spokePoolVerifier,
  };

  writeFileSync(
    `./src/data/routes_${hubPoolChainId}_${routeFileContent.hubPoolAddress}.json`,
    await prettier.format(JSON.stringify(routeFileContent, null, 2), {
      parser: "json",
    })
  );
}

function transformBridgeRoute(route: Route, hubPoolChainId: number) {
  return route.toChains.flatMap((toChain: ToChain) => {
    return toChain.tokens.map((token: ToToken) => {
      const inputTokenSymbol =
        typeof token === "object" ? token.inputTokenSymbol : token;
      const outputTokenSymbol =
        typeof token === "object" ? token.outputTokenSymbol : token;
      try {
        return transformToRoute(
          route,
          toChain,
          inputTokenSymbol,
          outputTokenSymbol,
          hubPoolChainId
        );
      } catch (e) {
        if (e instanceof Error) {
          throw new Error(
            `Failed to transform bridge route ${route.fromChain}->${toChain.chainId}: ${e.message}`
          );
        }
        throw e;
      }
    });
  });
}

function transformSwapRoute(route: Route, hubPoolChainId: number) {
  return route.toChains.flatMap((toChain: ToChain) => {
    return toChain.swapTokens.map((token: SwapToken) => {
      const {
        swapInputTokenSymbol,
        acrossInputTokenSymbol,
        acrossOutputTokenSymbol,
      } = token;

      const swapInputToken = getTokenBySymbol(
        swapInputTokenSymbol,
        route.fromChain,
        hubPoolChainId
      );
      try {
        const bridgeRoute = transformToRoute(
          route,
          toChain,
          acrossInputTokenSymbol,
          acrossOutputTokenSymbol,
          hubPoolChainId
        );

        return {
          ...bridgeRoute,
          swapTokenAddress: swapInputToken.address,
          swapTokenSymbol: swapInputToken.symbol,
          swapTokenL1TokenAddress: swapInputToken.l1TokenAddress,
        };
      } catch (e) {
        if (e instanceof Error) {
          throw new Error(
            `Failed to transform swap route ${route.fromChain}->${toChain.chainId}: ${e.message}`
          );
        }
        throw e;
      }
    });
  });
}

function transformToRoute(
  route: Route,
  toChain: ToChain,
  inputTokenSymbol: ValidTokenSymbol,
  outputTokenSymbol: ValidTokenSymbol,
  hubPoolChainId: number
) {
  const inputToken = getTokenBySymbol(
    inputTokenSymbol,
    route.fromChain,
    hubPoolChainId
  );
  const outputToken = getTokenBySymbol(
    outputTokenSymbol,
    toChain.chainId,
    hubPoolChainId
  );

  if (inputToken.l1TokenAddress !== outputToken.l1TokenAddress) {
    throw new Error("Mismatching L1 addresses");
  }

  return {
    fromChain: route.fromChain,
    toChain: toChain.chainId,
    fromTokenAddress: inputToken.address,
    toTokenAddress: outputToken.address,
    fromSpokeAddress: utils.getAddress(route.fromSpokeAddress),
    fromTokenSymbol: inputTokenSymbol,
    toTokenSymbol: outputTokenSymbol,
    isNative: inputTokenSymbol === TOKEN_SYMBOLS_MAP.ETH.symbol,
    toNative: outputTokenSymbol === TOKEN_SYMBOLS_MAP.ETH.symbol,
    l1TokenAddress: inputToken.l1TokenAddress,
  };
}

function getTokenBySymbol(
  tokenSymbol: ValidTokenSymbol,
  chainId: number | string,
  l1ChainId: number
) {
  const tokenAddress = TOKEN_SYMBOLS_MAP[tokenSymbol]?.addresses[chainId];

  if (!tokenAddress) {
    throw new Error(
      `Could not find address for ${tokenSymbol} on chain ${chainId}`
    );
  }

  const l1TokenAddress =
    TOKEN_SYMBOLS_MAP[isBridgedUsdc(tokenSymbol) ? "USDC" : tokenSymbol]
      ?.addresses[l1ChainId];

  if (!l1TokenAddress) {
    throw new Error(`Could not find L1 token address for ${tokenSymbol}`);
  }

  return {
    chainId,
    address: utils.getAddress(tokenAddress),
    symbol: tokenSymbol,
    l1TokenAddress: utils.getAddress(l1TokenAddress),
  };
}

function isBridgedUsdc(tokenSymbol: string) {
  return tokenSymbol === "USDC.e" || tokenSymbol === "USDbC";
}

function getBridgedUsdcSymbol(chainId: number) {
  return [CHAIN_IDs.BASE, CHAIN_IDs.BASE_SEPOLIA].includes(chainId)
    ? "USDbC"
    : "USDC.e";
}

generateRoutes(Number(process.argv[2]));
