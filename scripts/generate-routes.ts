import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "@across-protocol/constants";
import { utils as sdkUtils } from "@across-protocol/sdk";

import { utils } from "ethers";
import { writeFileSync } from "fs";
import * as prettier from "prettier";
import path from "path";
import * as chainConfigs from "./chain-configs";
import * as externConfigs from "./extern-configs";
import assert from "assert";

export const nonEthChains = [
  CHAIN_IDs.POLYGON,
  CHAIN_IDs.POLYGON_AMOY,
  CHAIN_IDs.ALEPH_ZERO,
  CHAIN_IDs.LENS,
  CHAIN_IDs.LENS_SEPOLIA,
  CHAIN_IDs.SOLANA_DEVNET,
  CHAIN_IDs.SOLANA,
];

export function isNonEthChain(chainId: number): boolean {
  return nonEthChains.includes(chainId);
}

function getTokenSymbolForLogo(tokenSymbol: string): string {
  switch (tokenSymbol) {
    case "USDC.e":
    case "USDbC":
    case "USDzC":
      return "USDC";
    default:
      return tokenSymbol;
  }
}

function getDeployedAddress(contractName: string, chainId: number): string {
  return sdkUtils.getDeployedAddress(contractName, chainId, true) as string;
}

type Route =
  (typeof enabledRoutes)[keyof typeof enabledRoutes]["routes"][number];
type ToChain = Route["toChains"][number];
type ToToken = ToChain["tokens"][number];
type SwapToken = ToChain["swapTokens"][number];
type ValidTokenSymbol = string;

const enabledMainnetExternalProjects = [externConfigs.HYPERLIQUID];

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
  chainConfigs.SCROLL,
  chainConfigs.REDSTONE,
  chainConfigs.ZORA,
  chainConfigs.WORLD_CHAIN,
  chainConfigs.ALEPH_ZERO,
  chainConfigs.INK,
  chainConfigs.SONEIUM,
  chainConfigs.UNICHAIN,
  chainConfigs.LENS,
];
3;
const enabledSepoliaChainConfigs = [
  chainConfigs.SEPOLIA,
  chainConfigs.BASE_SEPOLIA,
  chainConfigs.ARBITRUM_SEPOLIA,
  chainConfigs.OPTIMISM_SEPOLIA,
  chainConfigs.MODE_SEPOLIA,
  chainConfigs.POLYGON_AMOY,
  chainConfigs.BLAST_SEPOLIA,
  chainConfigs.LISK_SEPOLIA,
  chainConfigs.LENS_SEPOLIA,
  chainConfigs.UNICHAIN_SEPOLIA,
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
    pools: [],
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
        CHAIN_IDs.REDSTONE,
        CHAIN_IDs.SCROLL,
        CHAIN_IDs.ZORA,
        CHAIN_IDs.WORLD_CHAIN,
        CHAIN_IDs.INK,
        CHAIN_IDs.LENS,
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
    routes: transformChainConfigs(
      enabledMainnetChainConfigs,
      enabledMainnetExternalProjects
    ),
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
    routes: transformChainConfigs(enabledSepoliaChainConfigs, []),
  },
} as const;

function transformChainConfigs(
  enabledChainConfigs: typeof enabledMainnetChainConfigs,
  enabledExternalProjects: typeof enabledMainnetExternalProjects
) {
  const transformedChainConfigs: {
    fromChain: number;
    fromSpokeAddress: string;
    externalProjectId?: string;
    toChains: {
      chainId: number;
      externalProjectId?: string;
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
    const fromSpokeAddress = chainConfig.spokePool.address;
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

      const tokens = processTokenRoutes(chainConfig, toChainConfig);

      // Handle USDC swap tokens
      const usdcSwapTokens =
        chainConfig.enableCCTP && hasBridgedUsdc(fromChainId)
          ? getUsdcSwapTokens(fromChainId, toChainId)
          : [];

      const toChain = {
        chainId: toChainId,
        tokens,
        swapTokens: usdcSwapTokens.filter(
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

    for (const externalProject of enabledExternalProjects) {
      if (externalProject.intermediaryChain === fromChainId) {
        continue;
      }
      const associatedChain = enabledChainConfigs.find(
        (config) => config.chainId === externalProject.intermediaryChain
      );
      assert(associatedChain, "Associated chain not found");

      let associatedRoutes = processTokenRoutes(
        chainConfig,
        { ...associatedChain, enableCCTP: false },
        externalProject.tokens
      );

      const externalProjectId = externalProject.projectId;

      // Handle USDC swap tokens
      const usdcSwapTokens = [];

      const toChain = {
        chainId: externalProject.intermediaryChain,
        externalProjectId,
        tokens: associatedRoutes,
        swapTokens: usdcSwapTokens.filter(
          ({ acrossInputTokenSymbol, acrossOutputTokenSymbol }) =>
            associatedRoutes.some((token) =>
              typeof token === "string"
                ? token === acrossInputTokenSymbol
                : token.inputTokenSymbol === acrossInputTokenSymbol
            ) &&
            associatedRoutes.some((token) =>
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

function processTokenRoutes(
  fromConfig: typeof chainConfigs.MAINNET,
  toConfig: typeof chainConfigs.MAINNET,
  tokensToProcess?: string[]
) {
  const toChainId = toConfig.chainId;
  const tokens = tokensToProcess ?? fromConfig.tokens;
  return tokens.flatMap((token) => {
    const tokenSymbol = typeof token === "string" ? token : token.symbol;

    // If the fromConfig does not support the token, return an empty array
    if (!fromConfig.tokens.includes(tokenSymbol)) {
      return [];
    }

    // Handle native USDC -> bridged USDC routes
    if (tokenSymbol === "USDC") {
      if (toConfig.enableCCTP) {
        // Some chains only have native CCTP USDC
        if (hasBridgedUsdc(toConfig.chainId)) {
          return [
            "USDC",
            {
              inputTokenSymbol: "USDC",
              outputTokenSymbol: getBridgedUsdcSymbol(toConfig.chainId),
            },
          ];
        } else {
          return ["USDC"];
        }
      } else if (
        toConfig.tokens.find(
          (token) => typeof token === "string" && sdkUtils.isBridgedUsdc(token)
        )
      ) {
        return [
          {
            inputTokenSymbol: "USDC",
            outputTokenSymbol: getBridgedUsdcSymbol(toChainId),
          },
        ];
      }
    }

    // Handle bridged USDC -> native/bridged USDC routes
    if (sdkUtils.isBridgedUsdc(tokenSymbol)) {
      if (toConfig.enableCCTP) {
        // Some chains only have native CCTP USDC
        if (hasBridgedUsdc(toConfig.chainId)) {
          return [
            {
              inputTokenSymbol: tokenSymbol,
              outputTokenSymbol: "USDC",
            },
            {
              inputTokenSymbol: tokenSymbol,
              outputTokenSymbol: getBridgedUsdcSymbol(toChainId),
            },
          ];
        } else {
          return [
            {
              inputTokenSymbol: tokenSymbol,
              outputTokenSymbol: "USDC",
            },
          ];
        }
      } else if (toConfig.tokens.includes("USDC")) {
        return [
          {
            inputTokenSymbol: tokenSymbol,
            outputTokenSymbol: "USDC",
          },
        ];
      } else if (
        toConfig.tokens.find(
          (token) => typeof token === "string" && sdkUtils.isBridgedUsdc(token)
        ) &&
        hasBridgedUsdc(toChainId)
      ) {
        return [
          {
            inputTokenSymbol: tokenSymbol,
            outputTokenSymbol: getBridgedUsdcSymbol(toChainId),
          },
        ];
      }
    }

    // Handle USDB -> DAI
    if (tokenSymbol === "USDB" && toConfig.tokens.includes("DAI")) {
      return [
        {
          inputTokenSymbol: "USDB",
          outputTokenSymbol: "DAI",
        },
      ];
    }
    if (tokenSymbol === "DAI" && toConfig.tokens.includes("USDB")) {
      return [
        {
          inputTokenSymbol: "DAI",
          outputTokenSymbol: "USDB",
        },
      ];
    }

    if (tokenSymbol === "WGRASS" && toConfig.tokens.includes("GRASS")) {
      return [
        {
          inputTokenSymbol: "WGRASS",
          outputTokenSymbol: "GRASS",
        },
      ];
    }

    // Handle WETH Polygon & other non-eth chains
    if (
      tokenSymbol === "WETH" &&
      !toConfig.tokens.includes("ETH") &&
      toConfig.tokens.includes("WETH") &&
      fromConfig.tokens.includes("ETH")
    ) {
      return ["WETH", "ETH"];
    }

    const chainIds = typeof token === "string" ? [toChainId] : token.chainIds;

    const toToken = toConfig.tokens.find((token) =>
      typeof token === "string"
        ? token === tokenSymbol
        : token.symbol === tokenSymbol
    );
    if (
      !toToken ||
      (typeof toToken === "object" &&
        !toToken.chainIds.includes(fromConfig.chainId)) ||
      !chainIds.includes(toChainId)
    ) {
      return [];
    }

    return tokenSymbol;
  });
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

  // helper file with chains
  const chainsFileContent = (
    hubPoolChainId === CHAIN_IDs.MAINNET
      ? enabledMainnetChainConfigs
      : enabledSepoliaChainConfigs
  ).map((chainConfig) => {
    const [chainKey] =
      Object.entries(chainConfigs).find(
        ([, config]) => config.chainId === chainConfig.chainId
      ) || [];
    if (!chainKey) {
      throw new Error(
        `Could not find chain key for chain ${chainConfig.chainId}`
      );
    }
    const assetsBaseUrl = `https://raw.githubusercontent.com/across-protocol/frontend/master`;
    const getTokenInfo = (tokenSymbol: string) => {
      const tokenInfo =
        TOKEN_SYMBOLS_MAP[tokenSymbol as keyof typeof TOKEN_SYMBOLS_MAP];
      return {
        address: utils.getAddress(
          tokenInfo.addresses[chainConfig.chainId] as string
        ),
        symbol: tokenSymbol,
        name: tokenInfo.name,
        decimals: tokenInfo.decimals,
        logoUrl: `${assetsBaseUrl}/src/assets/token-logos/${getTokenSymbolForLogo(tokenSymbol).toLowerCase()}.svg`,
      };
    };
    return {
      chainId: chainConfig.chainId,
      name: chainConfig.name,
      publicRpcUrl: chainConfig.publicRpcUrl,
      explorerUrl: chainConfig.blockExplorer,
      logoUrl: `${assetsBaseUrl}${path.resolve("/scripts/chain-configs/", chainKey.toLowerCase().replace("_", "-"), chainConfig.logoPath)}`,
      spokePool: chainConfig.spokePool.address,
      spokePoolBlock: chainConfig.spokePool.blockNumber,
      inputTokens: routeFileContent.routes
        .filter((route) => route.fromChain === chainConfig.chainId)
        .map((route) => getTokenInfo(route.fromTokenSymbol))
        .reduce(
          (acc, token) => {
            if (!acc.find((t) => t.symbol === token.symbol)) {
              return [...acc, token];
            }
            return acc;
          },
          [] as ReturnType<typeof getTokenInfo>[]
        ),
      outputTokens: routeFileContent.routes
        .filter((route) => route.toChain === chainConfig.chainId)
        .map((route) => getTokenInfo(route.toTokenSymbol))
        .reduce(
          (acc, token) => {
            if (!acc.find((t) => t.symbol === token.symbol)) {
              return [...acc, token];
            }
            return acc;
          },
          [] as ReturnType<typeof getTokenInfo>[]
        ),
    };
  });
  writeFileSync(
    `./src/data/chains_${hubPoolChainId}.json`,
    await prettier.format(JSON.stringify(chainsFileContent, null, 2), {
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

  const fromChain = Object.values(chainConfigs).find(
    (config) => config.chainId === route.fromChain
  )!;
  const isNative = inputTokenSymbol === fromChain.nativeToken;

  return {
    fromChain: route.fromChain,
    toChain: toChain.chainId,
    fromTokenAddress: inputToken.address,
    toTokenAddress: outputToken.address,
    fromSpokeAddress: utils.getAddress(route.fromSpokeAddress),
    fromTokenSymbol: inputTokenSymbol,
    toTokenSymbol: outputTokenSymbol,
    isNative,
    l1TokenAddress: inputToken.l1TokenAddress,
    externalProjectId: toChain.externalProjectId,
  };
}

function getTokenBySymbol(
  tokenSymbol: ValidTokenSymbol,
  chainId: number | string,
  l1ChainId: number
) {
  const tokenAddress =
    TOKEN_SYMBOLS_MAP[tokenSymbol as keyof typeof TOKEN_SYMBOLS_MAP]?.addresses[
      Number(chainId)
    ];

  if (!tokenAddress) {
    throw new Error(
      `Could not find address for ${tokenSymbol} on chain ${chainId}`
    );
  }

  const effectiveSymbol = (
    sdkUtils.isBridgedUsdc(tokenSymbol) ? "USDC" : tokenSymbol
  ) as keyof typeof TOKEN_SYMBOLS_MAP;
  const l1TokenAddress =
    TOKEN_SYMBOLS_MAP[effectiveSymbol]?.addresses[l1ChainId];

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

function getUsdcSwapTokens(fromChainId: number, toChainId: number) {
  const swapInputTokenSymbol = getBridgedUsdcSymbol(fromChainId);
  if (hasBridgedUsdc(toChainId)) {
    return [
      {
        swapInputTokenSymbol,
        acrossInputTokenSymbol: "USDC",
        acrossOutputTokenSymbol: "USDC",
      },
      {
        swapInputTokenSymbol,
        acrossInputTokenSymbol: "USDC",
        acrossOutputTokenSymbol: getBridgedUsdcSymbol(toChainId),
      },
    ];
  } else {
    return [
      {
        swapInputTokenSymbol,
        acrossInputTokenSymbol: "USDC",
        acrossOutputTokenSymbol: "USDC",
      },
    ];
  }
}

function getBridgedUsdcSymbol(chainId: number) {
  switch (chainId) {
    case CHAIN_IDs.BASE:
    case CHAIN_IDs.BASE_SEPOLIA:
      return TOKEN_SYMBOLS_MAP.USDbC.symbol;
    case CHAIN_IDs.ZORA:
      return TOKEN_SYMBOLS_MAP.USDzC.symbol;
    default:
      return TOKEN_SYMBOLS_MAP["USDC.e"].symbol;
  }
}

function hasBridgedUsdc(chainId: number) {
  const bridgedUsdcSymbol = getBridgedUsdcSymbol(chainId);
  const token =
    TOKEN_SYMBOLS_MAP[bridgedUsdcSymbol as keyof typeof TOKEN_SYMBOLS_MAP]
      .addresses[chainId];
  return !!token;
}

generateRoutes(Number(process.argv[2]));
