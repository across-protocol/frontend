import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "@across-protocol/constants";
import { writeFileSync } from "fs";
import { getAddress, isAddress as isEvmAddress } from "viem";
import { utils as sdkUtils } from "@across-protocol/sdk";
import { isAddress as isSvmAddress } from "@solana/kit";
import * as prettier from "prettier";
import path from "path";
import * as chainConfigs from "./chain-configs";
import * as externConfigs from "./extern-configs";
import assert from "assert";

// TODO: replace with Address utilities from sdk
export function checksumAddress(address: string) {
  if (isEvmAddress(address)) {
    return getAddress(address);
  }
  if (isSvmAddress(address)) {
    return address;
  }
  throw new Error("Invalid address");
}

export const nonEthChains = [
  CHAIN_IDs.POLYGON,
  CHAIN_IDs.POLYGON_AMOY,
  CHAIN_IDs.ALEPH_ZERO,
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
    case "USDC-BNB":
      return "USDC";
    case "USDT-BNB":
      return "USDT";
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

export const enabledMainnetChainConfigs = [
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
  chainConfigs.SOLANA,
];

export const enabledSepoliaChainConfigs = [
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
  chainConfigs.SOLANA_DEVNET,
  chainConfigs.TATARA,
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
      address: "0x3Fb9cED51E968594C87963a371Ed90c39519f65A",
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
        CHAIN_IDs.ALEPH_ZERO,
        CHAIN_IDs.SONEIUM,
        CHAIN_IDs.UNICHAIN,
      ],
    },
    // Addresses of token-scoped `SwapAndBridge` contracts, i.e. USDC.e -> USDC swaps
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
      },
    },
    // Addresses of `UniversalSwapAndBridge` contracts from deployment:
    // https://github.com/across-protocol/contracts/pull/731/commits/6bdbfd38f50b616ac25e49687cbac6fb6bcb543b
    universalSwapAndBridgeAddresses: {
      "1inch": {
        [CHAIN_IDs.ARBITRUM]: "0x81C7601ac0c5825e89F967f9222B977CCD78aD77",
        [CHAIN_IDs.BASE]: "0x98285D11B9F7aFec2d475805E5255f26B4490167",
        [CHAIN_IDs.OPTIMISM]: "0x7631eA29479Ee265241F13FB48555A2C886d3Bf8",
        [CHAIN_IDs.POLYGON]: "0xc2dcb88873e00c9d401de2cbba4c6a28f8a6e2c2",
      },
      uniswap: {
        [CHAIN_IDs.ARBITRUM]: "0x2414A759d4EFF700Ad81e257Ab5187d07eCeEbAb",
        [CHAIN_IDs.BASE]: "0xed8b9c9aE7aCEf12eb4650d26Eb876005a4752d2",
        [CHAIN_IDs.BLAST]: "0x57EE47829369e2EF62fBb423648bec70d0366204",
        [CHAIN_IDs.LENS]: "0x793Ff9Cd09819C537500dFcEB6F61861c1B80dCD",
        [CHAIN_IDs.MAINNET]: "0x0e84f089B0923EfeA51C6dF91581BFBa66A3484A",
        [CHAIN_IDs.OPTIMISM]: "0x04989eaF03547E6583f9d9e42aeD11D2b78A808b",
        [CHAIN_IDs.POLYGON]: "0xa55490E20057BD4775618D0FC8D51F59f602FED0",
        [CHAIN_IDs.WORLD_CHAIN]: "0x56e2d1b8C7dE8D11B282E1b4C924C32D91f9102B",
        [CHAIN_IDs.ZORA]: "0x75b84707e6Bf5bc48DbC3AD883c23192C869AAE4",
        [CHAIN_IDs.ZK_SYNC]: "0xdB82479e3903869fbF8B308162E332FED771D51B",
      },
      gho: {
        [CHAIN_IDs.MAINNET]: "0x18d0915ADA0d5969db64CA44A42dB1b51D8421aa",
        [CHAIN_IDs.LENS]: "0xDFD7f7AC8F2331C4E83A43E73aB7579e736AC1Bf",
      },
      "gho-multicall3": {
        [CHAIN_IDs.MAINNET]: "0x9736F26C6311701A984A53A0b555f8A20225173A",
      },
    },
    spokePoolPeripheryAddresses: {
      [CHAIN_IDs.ARBITRUM]: "0xED7Bf315Ba2E9Db86b766b8AaC48502298dfe7d3",
      [CHAIN_IDs.BASE]: "0xED7Bf315Ba2E9Db86b766b8AaC48502298dfe7d3",
      [CHAIN_IDs.BLAST]: "0xED7Bf315Ba2E9Db86b766b8AaC48502298dfe7d3",
      [CHAIN_IDs.MAINNET]: "0xED7Bf315Ba2E9Db86b766b8AaC48502298dfe7d3",
      [CHAIN_IDs.OPTIMISM]: "0xED7Bf315Ba2E9Db86b766b8AaC48502298dfe7d3",
      [CHAIN_IDs.POLYGON]: "0xED7Bf315Ba2E9Db86b766b8AaC48502298dfe7d3",
      [CHAIN_IDs.WORLD_CHAIN]: "0xED7Bf315Ba2E9Db86b766b8AaC48502298dfe7d3",
      [CHAIN_IDs.ZK_SYNC]: "0xDFD7f7AC8F2331C4E83A43E73aB7579e736AC1Bf",
      [CHAIN_IDs.ZORA]: "0xED7Bf315Ba2E9Db86b766b8AaC48502298dfe7d3",
    },
    spokePoolPeripheryProxyAddresses: {
      [CHAIN_IDs.ARBITRUM]: "0x2d5E44b66bD40267fb816c9537E026545bEbbAC8",
      [CHAIN_IDs.BASE]: "0x2d5E44b66bD40267fb816c9537E026545bEbbAC8",
      [CHAIN_IDs.BLAST]: "0x2d5E44b66bD40267fb816c9537E026545bEbbAC8",
      [CHAIN_IDs.MAINNET]: "0x2d5E44b66bD40267fb816c9537E026545bEbbAC8",
      [CHAIN_IDs.OPTIMISM]: "0x2d5E44b66bD40267fb816c9537E026545bEbbAC8",
      [CHAIN_IDs.POLYGON]: "0x2d5E44b66bD40267fb816c9537E026545bEbbAC8",
      [CHAIN_IDs.WORLD_CHAIN]: "0x2d5E44b66bD40267fb816c9537E026545bEbbAC8",
      [CHAIN_IDs.ZK_SYNC]: "0x793Ff9Cd09819C537500dFcEB6F61861c1B80dCD",
      [CHAIN_IDs.ZORA]: "0x2d5E44b66bD40267fb816c9537E026545bEbbAC8",
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
    universalSwapAndBridgeAddresses: {
      uniswap: {},
    },
    spokePoolPeripheryAddresses: {},
    spokePoolPeripheryProxyAddresses: {},
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
        chainConfig.enableCCTP && hasBridgedUsdcOrVariant(fromChainId)
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
        if (hasBridgedUsdcOrVariant(toConfig.chainId)) {
          return [
            "USDC",
            {
              inputTokenSymbol: "USDC",
              outputTokenSymbol: getBridgedUsdcOrVariantSymbol(
                toConfig.chainId
              ),
            },
          ];
        } else {
          return ["USDC"];
        }
      } else if (
        toConfig.tokens.find(
          (token) => typeof token === "string" && isBridgedUsdcOrVariant(token)
        )
      ) {
        return [
          {
            inputTokenSymbol: "USDC",
            outputTokenSymbol: getBridgedUsdcOrVariantSymbol(toChainId),
          },
        ];
      }
    }

    // Handle bridged USDC -> native/bridged USDC routes
    if (isBridgedUsdcOrVariant(tokenSymbol)) {
      if (toConfig.enableCCTP) {
        // Some chains only have native CCTP USDC
        if (hasBridgedUsdcOrVariant(toConfig.chainId)) {
          return [
            {
              inputTokenSymbol: tokenSymbol,
              outputTokenSymbol: "USDC",
            },
            {
              inputTokenSymbol: tokenSymbol,
              outputTokenSymbol: getBridgedUsdcOrVariantSymbol(toChainId),
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
          (token) => typeof token === "string" && isBridgedUsdcOrVariant(token)
        ) &&
        hasBridgedUsdcOrVariant(toChainId)
      ) {
        return [
          {
            inputTokenSymbol: tokenSymbol,
            outputTokenSymbol: getBridgedUsdcOrVariantSymbol(toChainId),
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

    if (tokenSymbol === "WBNB" && toConfig.tokens.includes("BNB")) {
      return [
        {
          inputTokenSymbol: "WBNB",
          outputTokenSymbol: "BNB",
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

    // Handle USDT on BNB
    if (tokenSymbol === "USDT" && toConfig.tokens.includes("USDT-BNB")) {
      return [
        {
          inputTokenSymbol: "USDT",
          outputTokenSymbol: "USDT-BNB",
        },
      ];
    } else if (tokenSymbol === "USDT-BNB" && toConfig.tokens.includes("USDT")) {
      return [
        {
          inputTokenSymbol: "USDT-BNB",
          outputTokenSymbol: "USDT",
        },
      ];
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
    hubPoolAddress: checksumAddress(config.hubPoolAddress),
    hubPoolWethAddress: checksumAddress(config.hubPoolWethAddress),
    acrossConfigStoreAddress: checksumAddress(config.acrossConfigStoreAddress),
    acrossTokenAddress: checksumAddress(config.acrossTokenAddress),
    acceleratingDistributorAddress: checksumAddress(
      config.acceleratingDistributorAddress
    ),
    merkleDistributorAddress: checksumAddress(config.merkleDistributorAddress),
    claimAndStakeAddress: checksumAddress(config.claimAndStakeAddress),
    swapAndBridgeAddresses: checksumAddressesOfNestedMap(
      config.swapAndBridgeAddresses as Record<string, Record<string, string>>
    ),
    universalSwapAndBridgeAddresses: checksumAddressesOfNestedMap(
      config.universalSwapAndBridgeAddresses as Record<
        string,
        Record<string, string>
      >
    ),
    spokePoolPeripheryAddresses: checksumAddressOfMap(
      config.spokePoolPeripheryAddresses as Record<string, string>
    ),
    spokePoolPeripheryProxyAddresses: checksumAddressOfMap(
      config.spokePoolPeripheryProxyAddresses as Record<string, string>
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
        address: checksumAddress(
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
        throw new Error(
          `Failed to transform swap route ${route.fromChain}->${toChain.chainId}`,
          {
            cause: e,
          }
        );
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
  let inputToken = getTokenBySymbol(
    inputTokenSymbol,
    route.fromChain,
    hubPoolChainId
  );
  const outputToken = getTokenBySymbol(
    outputTokenSymbol,
    toChain.chainId,
    hubPoolChainId
  );
  const fromChain = Object.values(chainConfigs).find(
    (config) => config.chainId === route.fromChain
  )!;

  if (fromChain.chainId === CHAIN_IDs.LENS && inputTokenSymbol === "GHO") {
    inputToken = getTokenBySymbol("WGHO", route.fromChain, hubPoolChainId);
  }

  if (inputToken.l1TokenAddress !== outputToken.l1TokenAddress) {
    throw new Error("Mismatching L1 addresses");
  }

  const isNative = inputTokenSymbol === fromChain.nativeToken;

  return {
    fromChain: route.fromChain,
    toChain: toChain.chainId,
    fromTokenAddress: inputToken.address,
    toTokenAddress: outputToken.address,
    fromSpokeAddress: checksumAddress(route.fromSpokeAddress),
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
    isBridgedUsdcOrVariant(tokenSymbol)
      ? "USDC"
      : tokenSymbol === "USDT-BNB"
        ? "USDT"
        : tokenSymbol
  ) as keyof typeof TOKEN_SYMBOLS_MAP;
  const l1TokenAddress =
    TOKEN_SYMBOLS_MAP[effectiveSymbol]?.addresses[l1ChainId];

  if (!l1TokenAddress) {
    throw new Error(`Could not find L1 token address for ${tokenSymbol}`);
  }

  return {
    chainId,
    address: checksumAddress(tokenAddress),
    symbol: tokenSymbol,
    l1TokenAddress: checksumAddress(l1TokenAddress),
  };
}

function getUsdcSwapTokens(fromChainId: number, toChainId: number) {
  const swapInputTokenSymbol = getBridgedUsdcOrVariantSymbol(fromChainId);
  if (hasBridgedUsdcOrVariant(toChainId)) {
    return [
      {
        swapInputTokenSymbol,
        acrossInputTokenSymbol: "USDC",
        acrossOutputTokenSymbol: "USDC",
      },
      {
        swapInputTokenSymbol,
        acrossInputTokenSymbol: "USDC",
        acrossOutputTokenSymbol: getBridgedUsdcOrVariantSymbol(toChainId),
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

function getBridgedUsdcOrVariantSymbol(chainId: number) {
  switch (chainId) {
    case CHAIN_IDs.BASE:
    case CHAIN_IDs.BASE_SEPOLIA:
      return TOKEN_SYMBOLS_MAP.USDbC.symbol;
    case CHAIN_IDs.ZORA:
      return TOKEN_SYMBOLS_MAP.USDzC.symbol;
    case CHAIN_IDs.BSC:
      return TOKEN_SYMBOLS_MAP["USDC-BNB"].symbol;
    default:
      return TOKEN_SYMBOLS_MAP["USDC.e"].symbol;
  }
}

function checksumAddressOfMap(map: Record<string, string>) {
  return Object.entries(map).reduce(
    (acc, [key, value]) => ({ ...acc, [key]: checksumAddress(value) }),
    {}
  );
}

function checksumAddressesOfNestedMap(
  nestedMap: Record<string, Record<string, string>>
) {
  return Object.entries(nestedMap).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: checksumAddressOfMap(value),
    }),
    {}
  );
}

function hasBridgedUsdcOrVariant(chainId: number) {
  const bridgedUsdcSymbol = getBridgedUsdcOrVariantSymbol(chainId);
  const token =
    TOKEN_SYMBOLS_MAP[bridgedUsdcSymbol as keyof typeof TOKEN_SYMBOLS_MAP]
      .addresses[chainId];
  return !!token;
}

function isBridgedUsdcOrVariant(tokenSymbol: string): boolean {
  return sdkUtils.isBridgedUsdc(tokenSymbol) || tokenSymbol === "USDC-BNB";
}

generateRoutes(Number(process.argv[2]));
