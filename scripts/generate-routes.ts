import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "@across-protocol/constants-v2";
import { utils as sdkUtils } from "@across-protocol/sdk-v2";
import { utils } from "ethers";
import { writeFileSync } from "fs";
import * as prettier from "prettier";

const { getDeployedAddress } = sdkUtils;

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
      ],
    },
    routes: [
      {
        fromChain: CHAIN_IDs.MAINNET,
        fromSpokeAddress: getDeployedAddress("SpokePool", CHAIN_IDs.MAINNET),
        toChains: [
          {
            chainId: CHAIN_IDs.OPTIMISM,
            tokens: [
              "WETH",
              "ETH",
              "USDC",
              "WBTC",
              "UMA",
              "DAI",
              "BAL",
              "ACX",
              "USDT",
              "SNX",
              "POOL",
            ],
          },
          {
            chainId: CHAIN_IDs.POLYGON,
            tokens: [
              "WETH",
              "ETH",
              "USDC",
              "WBTC",
              "UMA",
              "DAI",
              "BAL",
              "ACX",
              "USDT",
              "POOL",
            ],
          },
          {
            chainId: CHAIN_IDs.ARBITRUM,
            tokens: [
              "WETH",
              "ETH",
              "USDC",
              "WBTC",
              "UMA",
              "DAI",
              "BAL",
              "ACX",
              "USDT",
            ],
          },
          {
            chainId: CHAIN_IDs.ZK_SYNC,
            tokens: ["WETH", "ETH", "USDC", "USDT", "WBTC", "DAI"],
          },
          {
            chainId: CHAIN_IDs.BASE,
            tokens: ["WETH", "ETH", "USDC", "DAI", "BAL"],
          },
          {
            chainId: CHAIN_IDs.LINEA,
            tokens: ["WETH", "ETH", "USDC", "DAI", "USDT", "WBTC"],
          },
        ],
      },
      {
        fromChain: CHAIN_IDs.OPTIMISM,
        fromSpokeAddress: getDeployedAddress("SpokePool", CHAIN_IDs.OPTIMISM),
        toChains: [
          {
            chainId: CHAIN_IDs.MAINNET,
            tokens: [
              "WETH",
              "ETH",
              "USDC",
              "WBTC",
              "UMA",
              "DAI",
              "BAL",
              "ACX",
              "USDT",
              "SNX",
              "POOL",
            ],
          },
          {
            chainId: CHAIN_IDs.POLYGON,
            tokens: [
              "WETH",
              "ETH",
              "USDC",
              "WBTC",
              "UMA",
              "DAI",
              "BAL",
              "ACX",
              "USDT",
              "POOL",
            ],
          },
          {
            chainId: CHAIN_IDs.ARBITRUM,
            tokens: [
              "WETH",
              "ETH",
              "USDC",
              "WBTC",
              "UMA",
              "DAI",
              "BAL",
              "ACX",
              "USDT",
            ],
          },
          {
            chainId: CHAIN_IDs.ZK_SYNC,
            tokens: ["WETH", "ETH", "USDC", "WBTC", "USDT", "DAI"],
          },
          {
            chainId: CHAIN_IDs.BASE,
            tokens: ["WETH", "ETH", "USDC", "DAI", "BAL"],
          },
          {
            chainId: CHAIN_IDs.LINEA,
            tokens: ["WETH", "ETH", "USDC", "USDT", "DAI", "WBTC"],
          },
        ],
      },
      {
        fromChain: CHAIN_IDs.POLYGON,
        fromSpokeAddress: getDeployedAddress("SpokePool", CHAIN_IDs.POLYGON),
        toChains: [
          {
            chainId: CHAIN_IDs.MAINNET,
            tokens: [
              "DAI",
              "UMA",
              "WETH",
              "USDC",
              "WBTC",
              "BAL",
              "ACX",
              "USDT",
              "POOL",
            ],
          },
          {
            chainId: CHAIN_IDs.OPTIMISM,
            tokens: [
              "DAI",
              "UMA",
              "WETH",
              "USDC",
              "WBTC",
              "BAL",
              "ACX",
              "USDT",
              "POOL",
            ],
          },
          {
            chainId: CHAIN_IDs.ARBITRUM,
            tokens: [
              "UMA",
              "DAI",
              "WETH",
              "USDC",
              "WBTC",
              "BAL",
              "ACX",
              "USDT",
            ],
          },
          {
            chainId: CHAIN_IDs.ZK_SYNC,
            tokens: ["WETH", "USDC", "WBTC", "USDT", "DAI"],
          },
          {
            chainId: CHAIN_IDs.BASE,
            tokens: ["DAI", "WETH", "USDC", "BAL"],
          },
          {
            chainId: CHAIN_IDs.LINEA,
            tokens: ["WETH", "USDC", "USDT", "DAI", "WBTC"],
          },
        ],
      },
      {
        fromChain: CHAIN_IDs.ARBITRUM,
        fromSpokeAddress: getDeployedAddress("SpokePool", CHAIN_IDs.ARBITRUM),
        toChains: [
          {
            chainId: CHAIN_IDs.MAINNET,
            tokens: [
              "WBTC",
              "USDC",
              "WETH",
              "ETH",
              "UMA",
              "DAI",
              "BAL",
              "ACX",
              "USDT",
            ],
          },
          {
            chainId: CHAIN_IDs.OPTIMISM,
            tokens: [
              "WBTC",
              "USDC",
              "WETH",
              "ETH",
              "UMA",
              "DAI",
              "BAL",
              "ACX",
              "USDT",
            ],
          },
          {
            chainId: CHAIN_IDs.POLYGON,
            tokens: [
              "WBTC",
              "USDC",
              "WETH",
              "ETH",
              "UMA",
              "DAI",
              "BAL",
              "ACX",
              "USDT",
            ],
          },
          {
            chainId: CHAIN_IDs.ZK_SYNC,
            tokens: ["WBTC", "USDC", "WETH", "ETH", "USDT", "DAI"],
          },
          {
            chainId: CHAIN_IDs.BASE,
            tokens: ["USDC", "WETH", "ETH", "DAI", "BAL"],
          },
          {
            chainId: CHAIN_IDs.LINEA,
            tokens: ["WETH", "ETH", "USDC", "USDT", "DAI", "WBTC"],
          },
        ],
      },
      {
        fromChain: CHAIN_IDs.ZK_SYNC,
        fromSpokeAddress: getDeployedAddress("SpokePool", CHAIN_IDs.ZK_SYNC),
        toChains: [
          {
            chainId: CHAIN_IDs.MAINNET,
            tokens: ["WETH", "ETH", "USDC", "WBTC", "USDT", "DAI"],
          },
          {
            chainId: CHAIN_IDs.OPTIMISM,
            tokens: ["WETH", "ETH", "USDC", "WBTC", "USDT", "DAI"],
          },
          {
            chainId: CHAIN_IDs.ARBITRUM,
            tokens: ["WETH", "ETH", "USDC", "WBTC", "USDT", "DAI"],
          },
          {
            chainId: CHAIN_IDs.POLYGON,
            tokens: ["WETH", "USDC", "WBTC", "USDT", "DAI"],
          },
          {
            chainId: CHAIN_IDs.BASE,
            tokens: ["WETH", "ETH", "USDC", "DAI"],
          },
          {
            chainId: CHAIN_IDs.LINEA,
            tokens: ["WETH", "ETH", "USDC", "USDT", "DAI", "WBTC"],
          },
        ],
      },
      {
        fromChain: CHAIN_IDs.BASE,
        fromSpokeAddress: getDeployedAddress("SpokePool", CHAIN_IDs.BASE),
        toChains: [
          {
            chainId: CHAIN_IDs.MAINNET,
            tokens: ["USDC", "WETH", "ETH", "DAI", "BAL"],
          },
          {
            chainId: CHAIN_IDs.OPTIMISM,
            tokens: ["USDC", "WETH", "ETH", "DAI", "BAL"],
          },
          {
            chainId: CHAIN_IDs.POLYGON,
            tokens: ["USDC", "WETH", "ETH", "DAI", "BAL"],
          },
          {
            chainId: CHAIN_IDs.ARBITRUM,
            tokens: ["USDC", "WETH", "ETH", "DAI", "BAL"],
          },
          {
            chainId: CHAIN_IDs.ZK_SYNC,
            tokens: ["USDC", "WETH", "ETH", "DAI"],
          },
          {
            chainId: CHAIN_IDs.LINEA,
            tokens: ["WETH", "ETH", "USDC", "DAI"],
          },
        ],
      },
      {
        fromChain: CHAIN_IDs.LINEA,
        fromSpokeAddress: "0x7E63A5f1a8F0B4d0934B2f2327DAED3F6bb2ee75",
        toChains: [
          {
            chainId: CHAIN_IDs.MAINNET,
            tokens: ["WETH", "ETH", "USDC", "USDT", "DAI", "WBTC"],
          },
          {
            chainId: CHAIN_IDs.OPTIMISM,
            tokens: ["WETH", "ETH", "USDC", "USDT", "DAI", "WBTC"],
          },
          {
            chainId: CHAIN_IDs.POLYGON,
            tokens: ["WETH", "ETH", "USDC", "USDT", "DAI", "WBTC"],
          },
          {
            chainId: CHAIN_IDs.ARBITRUM,
            tokens: ["WETH", "ETH", "USDC", "USDT", "DAI", "WBTC"],
          },
          {
            chainId: CHAIN_IDs.ZK_SYNC,
            tokens: ["USDC", "WETH", "ETH", "DAI"],
          },
          {
            chainId: CHAIN_IDs.BASE,
            tokens: ["WETH", "ETH", "USDC", "DAI"],
          },
        ],
      },
    ],
  },
  [CHAIN_IDs.SEPOLIA]: {
    hubPoolChain: CHAIN_IDs.SEPOLIA,
    hubPoolAddress: getDeployedAddress("HubPool", CHAIN_IDs.SEPOLIA),
    hubPoolWethAddress: TOKEN_SYMBOLS_MAP.WETH.addresses[CHAIN_IDs.SEPOLIA],
    acrossConfigStoreAddress: getDeployedAddress(
      "AcrossConfigStore",
      CHAIN_IDs.SEPOLIA
    ),
    acrossTokenAddress: TOKEN_SYMBOLS_MAP.ACX.addresses[CHAIN_IDs.MAINNET],
    acceleratingDistributorAddress: sdkUtils.AddressZero,
    merkleDistributorAddress: sdkUtils.AddressZero,
    claimAndStakeAddress: sdkUtils.AddressZero,
    pools: [],
    spokePoolVerifier: {
      address: sdkUtils.AddressZero,
      enabledChains: [],
    },
    routes: [
      {
        fromChain: CHAIN_IDs.SEPOLIA,
        fromSpokeAddress: getDeployedAddress("SpokePool", CHAIN_IDs.SEPOLIA),
        toChains: [
          {
            chainId: CHAIN_IDs.BASE_SEPOLIA,
            tokens: ["WETH"],
          },
        ],
      },
      {
        fromChain: CHAIN_IDs.BASE_SEPOLIA,
        fromSpokeAddress: "0x82B564983aE7274c86695917BBf8C99ECb6F0F8F",
        toChains: [
          {
            chainId: CHAIN_IDs.SEPOLIA,
            tokens: ["WETH"],
          },
        ],
      },
    ],
  },
} as const;

function generateRoutes(hubPoolChainId = 1) {
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
    routes: config.routes.flatMap((route) => {
      return route.toChains.flatMap((toChain) => {
        return toChain.tokens.map((token) => {
          return {
            fromChain: route.fromChain,
            toChain: toChain.chainId,
            fromTokenAddress: utils.getAddress(
              TOKEN_SYMBOLS_MAP[token].addresses[route.fromChain]
            ),
            fromSpokeAddress: utils.getAddress(route.fromSpokeAddress),
            fromTokenSymbol:
              token === "USDC" ? getUsdcSymbol(route.fromChain) : token,
            isNative: token === TOKEN_SYMBOLS_MAP.ETH.symbol,
            l1TokenAddress: utils.getAddress(
              TOKEN_SYMBOLS_MAP[token].addresses[hubPoolChainId]
            ),
          };
        });
      });
    }),
    pools: config.pools,
    spokePoolVerifier: config.spokePoolVerifier,
  };

  writeFileSync(
    `./src/data/routes_${hubPoolChainId}_${routeFileContent.hubPoolAddress}.json`,
    prettier.format(JSON.stringify(routeFileContent, null, 2), {
      parser: "json",
    })
  );
}

function getUsdcSymbol(chainId: number) {
  if (
    [CHAIN_IDs.ARBITRUM, CHAIN_IDs.OPTIMISM, CHAIN_IDs.POLYGON].includes(
      chainId
    )
  ) {
    return "USDC.e";
  }

  if (chainId === CHAIN_IDs.BASE) {
    return "USDbC";
  }

  return "USDC";
}

generateRoutes(Number(process.argv[2]));
