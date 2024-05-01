import { CHAIN_IDs } from "@across-protocol/constants-v2";
import { utils as sdkUtils } from "@across-protocol/sdk-v2";
import { utils } from "ethers";
import { writeFileSync } from "fs";
import * as prettier from "prettier";

import { TOKEN_SYMBOLS_MAP } from "../api/_constants";

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
              { inputTokenSymbol: "USDC", outputTokenSymbol: "USDC.e" },
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
              { inputTokenSymbol: "USDC", outputTokenSymbol: "USDC.e" },
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
              { inputTokenSymbol: "USDC", outputTokenSymbol: "USDC.e" },
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
            chainId: CHAIN_IDs.ZK_SYNC,
            tokens: [
              "WETH",
              "ETH",
              { inputTokenSymbol: "USDC", outputTokenSymbol: "USDC.e" },
              "USDT",
              "WBTC",
              "DAI",
            ],
          },
          {
            chainId: CHAIN_IDs.BASE,
            tokens: [
              "WETH",
              "ETH",
              { inputTokenSymbol: "USDC", outputTokenSymbol: "USDbC" },
              "DAI",
              "BAL",
              "POOL",
            ],
          },
          {
            chainId: CHAIN_IDs.LINEA,
            tokens: [
              "WETH",
              "ETH",
              { inputTokenSymbol: "USDC", outputTokenSymbol: "USDC.e" },
              "DAI",
              "USDT",
              "WBTC",
            ],
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
              { inputTokenSymbol: "USDC.e", outputTokenSymbol: "USDC" },
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
              "USDC.e",
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
              "USDC.e",
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
            chainId: CHAIN_IDs.ZK_SYNC,
            tokens: ["WETH", "ETH", "USDC.e", "WBTC", "USDT", "DAI"],
          },
          {
            chainId: CHAIN_IDs.BASE,
            tokens: [
              "WETH",
              "ETH",
              { inputTokenSymbol: "USDC.e", outputTokenSymbol: "USDbC" },
              "DAI",
              "BAL",
              "POOL",
            ],
          },
          {
            chainId: CHAIN_IDs.LINEA,
            tokens: ["WETH", "ETH", "USDC.e", "USDT", "DAI", "WBTC"],
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
              { inputTokenSymbol: "USDC.e", outputTokenSymbol: "USDC" },
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
              "USDC.e",
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
              "USDC.e",
              "WBTC",
              "BAL",
              "ACX",
              "USDT",
              "POOL",
            ],
          },
          {
            chainId: CHAIN_IDs.ZK_SYNC,
            tokens: ["WETH", "USDC.e", "WBTC", "USDT", "DAI"],
          },
          {
            chainId: CHAIN_IDs.BASE,
            tokens: [
              "DAI",
              "WETH",
              { inputTokenSymbol: "USDC.e", outputTokenSymbol: "USDbC" },
              "BAL",
              "POOL",
            ],
          },
          {
            chainId: CHAIN_IDs.LINEA,
            tokens: ["WETH", "USDC.e", "USDT", "DAI", "WBTC"],
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
              { inputTokenSymbol: "USDC.e", outputTokenSymbol: "USDC" },
              "WETH",
              "ETH",
              "UMA",
              "DAI",
              "BAL",
              "ACX",
              "USDT",
              "POOL",
            ],
          },
          {
            chainId: CHAIN_IDs.OPTIMISM,
            tokens: [
              "WBTC",
              "USDC.e",
              "WETH",
              "ETH",
              "UMA",
              "DAI",
              "BAL",
              "ACX",
              "USDT",
              "POOL",
            ],
          },
          {
            chainId: CHAIN_IDs.POLYGON,
            tokens: [
              "WBTC",
              "USDC.e",
              "WETH",
              "ETH",
              "UMA",
              "DAI",
              "BAL",
              "ACX",
              "USDT",
              "POOL",
            ],
          },
          {
            chainId: CHAIN_IDs.ZK_SYNC,
            tokens: ["WBTC", "USDC.e", "WETH", "ETH", "USDT", "DAI"],
          },
          {
            chainId: CHAIN_IDs.BASE,
            tokens: [
              { inputTokenSymbol: "USDC.e", outputTokenSymbol: "USDbC" },
              "WETH",
              "ETH",
              "DAI",
              "BAL",
              "POOL",
            ],
          },
          {
            chainId: CHAIN_IDs.LINEA,
            tokens: ["WETH", "ETH", "USDC.e", "USDT", "DAI", "WBTC"],
          },
        ],
      },
      {
        fromChain: CHAIN_IDs.ZK_SYNC,
        fromSpokeAddress: getDeployedAddress("SpokePool", CHAIN_IDs.ZK_SYNC),
        toChains: [
          {
            chainId: CHAIN_IDs.MAINNET,
            tokens: [
              "WETH",
              "ETH",
              { inputTokenSymbol: "USDC.e", outputTokenSymbol: "USDC" },
              "WBTC",
              "USDT",
              "DAI",
            ],
          },
          {
            chainId: CHAIN_IDs.OPTIMISM,
            tokens: ["WETH", "ETH", "USDC.e", "WBTC", "USDT", "DAI"],
          },
          {
            chainId: CHAIN_IDs.ARBITRUM,
            tokens: ["WETH", "ETH", "USDC.e", "WBTC", "USDT", "DAI"],
          },
          {
            chainId: CHAIN_IDs.POLYGON,
            tokens: ["WETH", "USDC.e", "WBTC", "USDT", "DAI"],
          },
          {
            chainId: CHAIN_IDs.BASE,
            tokens: [
              "WETH",
              "ETH",
              { inputTokenSymbol: "USDC.e", outputTokenSymbol: "USDbC" },
              "DAI",
            ],
          },
          {
            chainId: CHAIN_IDs.LINEA,
            tokens: ["WETH", "ETH", "USDC.e", "USDT", "DAI", "WBTC"],
          },
        ],
      },
      {
        fromChain: CHAIN_IDs.BASE,
        fromSpokeAddress: getDeployedAddress("SpokePool", CHAIN_IDs.BASE),
        toChains: [
          {
            chainId: CHAIN_IDs.MAINNET,
            tokens: [
              { inputTokenSymbol: "USDbC", outputTokenSymbol: "USDC" },
              "WETH",
              "ETH",
              "DAI",
              "BAL",
              "POOL",
            ],
          },
          {
            chainId: CHAIN_IDs.OPTIMISM,
            tokens: [
              { inputTokenSymbol: "USDbC", outputTokenSymbol: "USDC.e" },
              "WETH",
              "ETH",
              "DAI",
              "BAL",
              "POOL",
            ],
          },
          {
            chainId: CHAIN_IDs.POLYGON,
            tokens: [
              { inputTokenSymbol: "USDbC", outputTokenSymbol: "USDC.e" },
              "WETH",
              "ETH",
              "DAI",
              "BAL",
              "POOL",
            ],
          },
          {
            chainId: CHAIN_IDs.ARBITRUM,
            tokens: [
              { inputTokenSymbol: "USDbC", outputTokenSymbol: "USDC.e" },
              "WETH",
              "ETH",
              "DAI",
              "BAL",
              "POOL",
            ],
          },
          {
            chainId: CHAIN_IDs.ZK_SYNC,
            tokens: [
              { inputTokenSymbol: "USDbC", outputTokenSymbol: "USDC.e" },
              "WETH",
              "ETH",
              "DAI",
            ],
          },
          {
            chainId: CHAIN_IDs.LINEA,
            tokens: [
              "WETH",
              "ETH",
              { inputTokenSymbol: "USDbC", outputTokenSymbol: "USDC.e" },
              "DAI",
            ],
          },
        ],
      },
      {
        fromChain: CHAIN_IDs.LINEA,
        fromSpokeAddress: "0x7E63A5f1a8F0B4d0934B2f2327DAED3F6bb2ee75",
        toChains: [
          {
            chainId: CHAIN_IDs.MAINNET,
            tokens: [
              "WETH",
              "ETH",
              { inputTokenSymbol: "USDC.e", outputTokenSymbol: "USDC" },
              "USDT",
              "DAI",
              "WBTC",
            ],
          },
          {
            chainId: CHAIN_IDs.OPTIMISM,
            tokens: ["WETH", "ETH", "USDC.e", "USDT", "DAI", "WBTC"],
          },
          {
            chainId: CHAIN_IDs.POLYGON,
            tokens: ["WETH", "ETH", "USDC.e", "USDT", "DAI", "WBTC"],
          },
          {
            chainId: CHAIN_IDs.ARBITRUM,
            tokens: ["WETH", "ETH", "USDC.e", "USDT", "DAI", "WBTC"],
          },
          {
            chainId: CHAIN_IDs.ZK_SYNC,
            tokens: ["USDC.e", "WETH", "ETH", "DAI"],
          },
          {
            chainId: CHAIN_IDs.BASE,
            tokens: [
              "WETH",
              "ETH",
              { inputTokenSymbol: "USDC.e", outputTokenSymbol: "USDbC" },
              "DAI",
            ],
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
            tokens: ["WETH", "USDC"],
          },
          {
            chainId: CHAIN_IDs.OPTIMISM_SEPOLIA,
            tokens: ["WETH", "USDC"],
          },
          {
            chainId: CHAIN_IDs.ARBITRUM_SEPOLIA,
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
            tokens: ["WETH", "USDC"],
          },
        ],
      },
      {
        fromChain: CHAIN_IDs.OPTIMISM_SEPOLIA,
        fromSpokeAddress: getDeployedAddress(
          "SpokePool",
          CHAIN_IDs.OPTIMISM_SEPOLIA
        ),
        toChains: [
          {
            chainId: CHAIN_IDs.SEPOLIA,
            tokens: ["WETH", "USDC"],
          },
        ],
      },
      {
        fromChain: CHAIN_IDs.ARBITRUM_SEPOLIA,
        fromSpokeAddress: getDeployedAddress(
          "SpokePool",
          CHAIN_IDs.ARBITRUM_SEPOLIA
        ),
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
          const inputTokenSymbol =
            typeof token === "object" ? token.inputTokenSymbol : token;
          const outputTokenSymbol =
            typeof token === "object" ? token.outputTokenSymbol : token;
          const inputTokenAddress =
            TOKEN_SYMBOLS_MAP[inputTokenSymbol].addresses[route.fromChain];
          const outputTokenAddress =
            TOKEN_SYMBOLS_MAP[outputTokenSymbol].addresses[toChain.chainId];

          if (!inputTokenAddress || !outputTokenAddress) {
            const isInputMissing = !inputTokenAddress;
            throw new Error(
              `Could not find address for ${
                isInputMissing ? "input" : "output"
              } token ${
                isInputMissing ? inputTokenSymbol : outputTokenSymbol
              } on chain ${isInputMissing ? route.fromChain : toChain.chainId}`
            );
          }

          const l1TokenAddress =
            TOKEN_SYMBOLS_MAP[
              isBridgedUsdc(inputTokenSymbol) ? "USDC" : inputTokenSymbol
            ].addresses[hubPoolChainId];

          if (!l1TokenAddress) {
            throw new Error(
              `Could not find L1 token address for ${inputTokenSymbol}`
            );
          }

          return {
            fromChain: route.fromChain,
            toChain: toChain.chainId,
            fromTokenAddress: utils.getAddress(inputTokenAddress),
            toTokenAddress: utils.getAddress(outputTokenAddress),
            fromSpokeAddress: utils.getAddress(route.fromSpokeAddress),
            fromTokenSymbol: inputTokenSymbol,
            toTokenSymbol: outputTokenSymbol,
            isNative: token === TOKEN_SYMBOLS_MAP.ETH.symbol,
            l1TokenAddress: utils.getAddress(l1TokenAddress),
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

function isBridgedUsdc(tokenSymbol: string) {
  return tokenSymbol === "USDC.e" || tokenSymbol === "USDbC";
}

generateRoutes(Number(process.argv[2]));
