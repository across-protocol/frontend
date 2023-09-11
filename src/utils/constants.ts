import assert from "assert";
import { ethers, providers } from "ethers";
import { constants, utils } from "@across-protocol/sdk-v2";
import * as superstruct from "superstruct";

import { parseEtherLike } from "./format";

import ethereumLogo from "assets/ethereum-logo.svg";
import optimismLogo from "assets/optimism-alt-logo.svg";
import wethLogo from "assets/weth-logo.svg";
import arbitrumLogo from "assets/arbitrum-logo.svg";
import bobaLogo from "assets/boba-logo.svg";
import polygonLogo from "assets/polygon-logo.svg";
import zkSyncLogo from "assets/zksync-logo.svg";
import baseLogo from "assets/base-logo.svg";
import usdcLogo from "assets/usdc-logo.png";
import daiLogo from "assets/dai.svg";
import wbtcLogo from "assets/wbtc.svg";
import umaLogo from "assets/uma.svg";
import acxLogo from "assets/across.svg";
import balLogo from "assets/bal.svg";
import usdtLogo from "assets/usdt-logo.svg";
import snxLogo from "assets/snx-logo.svg";
import pooltogetherLogo from "assets/pooltogether-logo.svg";
import unknownLogo from "assets/icons/question-24.svg";

// all routes should be pre imported to be able to switch based on chain id
import MainnetRoutes from "data/routes_1_0xc186fA914353c44b2E33eBE05f21846F1048bEda.json";
import GoerliRoutes from "data/routes_5_0x0e2817C49698cc0874204AeDf7c72Be2Bb7fCD5d.json";

/* Chains and Tokens section */
export enum ChainId {
  MAINNET = constants.CHAIN_IDs.MAINNET,
  OPTIMISM = constants.CHAIN_IDs.OPTIMISM,
  ARBITRUM = constants.CHAIN_IDs.ARBITRUM,
  POLYGON = constants.CHAIN_IDs.POLYGON,
  ZK_SYNC = constants.CHAIN_IDs.ZK_SYNC,
  BASE = constants.CHAIN_IDs.BASE,
  // testnets
  ARBITRUM_GOERLI = constants.CHAIN_IDs.ARBITRUM_GOERLI,
  ZK_SYNC_GOERLI = constants.CHAIN_IDs.ZK_SYNC_GOERLI,
  BASE_GOERLI = constants.CHAIN_IDs.BASE_GOERLI,
  GOERLI = constants.CHAIN_IDs.GOERLI,
  MUMBAI = constants.CHAIN_IDs.MUMBAI,
}

// Maps `ChainId` to an object and inverts the Key/Value
// pair. Ex) { "mainnet": 1 }
export const CanonicalChainName = Object.fromEntries(
  Object.entries(ChainId)
    .filter((v) => Number.isNaN(Number(v[0])))
    .map((v) => [v[0].toLowerCase(), Number(v[1])])
);

/* Colors and Media Queries section */
export const BREAKPOINTS = {
  tabletMin: 550,
  laptopMin: 1100,
  desktopMin: 1500,
};
export const QUERIES = {
  tabletAndUp: `(min-width: ${BREAKPOINTS.tabletMin / 16}rem)`,
  laptopAndUp: `(min-width: ${BREAKPOINTS.laptopMin / 16}rem)`,
  desktopAndUp: `(min-width: ${BREAKPOINTS.desktopMin / 16}rem)`,
  tabletAndDown: `(max-width: ${(BREAKPOINTS.laptopMin - 1) / 16}rem)`,
  mobileAndDown: `(max-width: ${(BREAKPOINTS.tabletMin - 1) / 16}rem)`,
};

export const COLORS = {
  gray: {
    100: "0deg 0% 89%",
    // Hex: #F5F5F5
    150: "0deg 0% 96%",

    // #2C2F33
    160: "214.3deg 7.4% 18.6%",
    // #27292c
    175: "216deg 6% 16.3%",
    // hsl(214.3,7.4%,18.6%)
    200: "220deg 2% 72%",
    // #2c2e32
    250: "220deg 6.4% 18.4%",
    300: "240deg 4% 27%",
    // #2d2e33
    500: "230deg 6% 19%",
    // #68686c
    550: "240deg 2% 42%",
    // #4d4c53
    600: "249deg 4% 31%",
  },
  primary: {
    // #6df8d8
    500: "166deg 92% 70%",
    // #565757
    600: "180deg 0.6% 33.9%",
    700: "180deg 15% 25%",
  },
  secondary: {
    500: "266deg 77% 62%",
  },
  error: {
    500: "11deg 92% 70%",
    300: "11deg 93% 94%",
  },
  // Hex: #ffffff
  white: "0deg 100% 100%",
  black: "0deg 0% 0%",
  umaRed: "0deg 100% 65%",
  purple: "267deg 77% 62%",
};

export type ChainInfo = {
  name: string;
  fullName?: string;
  chainId: ChainId;
  logoURI: string;
  rpcUrl?: string;
  explorerUrl: string;
  constructExplorerLink: (txHash: string) => string;
  pollingInterval: number;
  nativeCurrencySymbol: string;
};

export type ChainInfoList = ChainInfo[];
export type ChainInfoTable = Record<number, ChainInfo>;

export const defaultBlockPollingInterval =
  Number(process.env.REACT_APP_DEFAULT_BLOCK_POLLING_INTERVAL_S || 30) * 1000;
export const hubPoolChainId = Number(
  process.env.REACT_APP_HUBPOOL_CHAINID || 1
);

const defaultConstructExplorerLink =
  (explorerUrl: string) => (txHash: string) =>
    `${explorerUrl}/tx/${txHash}`;

export const chainInfoList: ChainInfoList = [
  {
    name: "Ethereum",
    fullName: "Ethereum Mainnet",
    chainId: ChainId.MAINNET,
    logoURI: ethereumLogo,
    explorerUrl: "https://etherscan.io",
    constructExplorerLink: defaultConstructExplorerLink("https://etherscan.io"),
    nativeCurrencySymbol: "ETH",
    pollingInterval: defaultBlockPollingInterval,
  },
  {
    name: "Arbitrum",
    fullName: "Arbitrum One",
    chainId: ChainId.ARBITRUM,
    logoURI: arbitrumLogo,
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    explorerUrl: "https://arbiscan.io",
    constructExplorerLink: (txHash: string) =>
      `https://arbiscan.io/tx/${txHash}`,
    nativeCurrencySymbol: "AETH",
    pollingInterval: defaultBlockPollingInterval,
  },
  {
    name: "Optimism",
    chainId: ChainId.OPTIMISM,
    logoURI: optimismLogo,
    rpcUrl: "https://mainnet.optimism.io",
    explorerUrl: "https://optimistic.etherscan.io",
    constructExplorerLink: (txHash: string) =>
      `https://optimistic.etherscan.io/tx/${txHash}`,
    nativeCurrencySymbol: "OETH",
    pollingInterval: defaultBlockPollingInterval,
  },
  {
    name: "Polygon",
    fullName: "Polygon Network",
    chainId: ChainId.POLYGON,
    logoURI: polygonLogo,
    rpcUrl: "https://rpc.ankr.com/polygon",
    explorerUrl: "https://polygonscan.com",
    constructExplorerLink: defaultConstructExplorerLink(
      "https://polygonscan.com"
    ),
    nativeCurrencySymbol: "MATIC",
    pollingInterval: defaultBlockPollingInterval,
  },
  {
    name: "zkSync",
    fullName: "zkSync Era",
    chainId: ChainId.ZK_SYNC,
    logoURI: zkSyncLogo,
    rpcUrl: "https://mainnet.era.zksync.io",
    explorerUrl: "https://explorer.zksync.io",
    constructExplorerLink: defaultConstructExplorerLink(
      "https://explorer.zksync.io"
    ),
    nativeCurrencySymbol: "ETH",
    pollingInterval: defaultBlockPollingInterval,
  },
  {
    name: "Base",
    fullName: "Base",
    chainId: ChainId.BASE,
    logoURI: baseLogo,
    rpcUrl: "https://mainnet.base.org",
    explorerUrl: "https://basescan.org",
    constructExplorerLink: defaultConstructExplorerLink("https://basescan.org"),
    nativeCurrencySymbol: "ETH",
    pollingInterval: defaultBlockPollingInterval,
  },
  // testnets
  {
    name: "Goerli",
    fullName: "Goerli Testnet",
    chainId: ChainId.GOERLI,
    logoURI: ethereumLogo,
    explorerUrl: "https://goerli.etherscan.io/",
    constructExplorerLink: defaultConstructExplorerLink(
      "https://goerli.etherscan.io/"
    ),
    nativeCurrencySymbol: "ETH",
    pollingInterval: defaultBlockPollingInterval,
  },
  {
    name: "Mumbai",
    chainId: ChainId.MUMBAI,
    logoURI: polygonLogo,
    rpcUrl: "https://matic-mumbai.chainstacklabs.com",
    explorerUrl: "https://mumbai.polygonscan.com",
    constructExplorerLink: defaultConstructExplorerLink(
      "https://mumbai.polygonscan.com"
    ),
    nativeCurrencySymbol: "WMATIC",
    pollingInterval: defaultBlockPollingInterval,
  },
  {
    name: "Arbitrum Goerli",
    fullName: "Arbitrum Testnet Goerli",
    chainId: ChainId.ARBITRUM_GOERLI,
    logoURI: arbitrumLogo,
    explorerUrl: "https://testnet.arbiscan.io",
    constructExplorerLink: (txHash: string) =>
      `https://testnet.arbiscan.io/tx/${txHash}`,
    nativeCurrencySymbol: "ETH",
    pollingInterval: defaultBlockPollingInterval,
  },
  {
    name: "zkSync Goerli",
    fullName: "zkSync Testnet Goerli",
    chainId: ChainId.ZK_SYNC_GOERLI,
    logoURI: zkSyncLogo,
    rpcUrl: "https://testnet.era.zksync.dev",
    explorerUrl: "https://goerli.explorer.zksync.io",
    constructExplorerLink: defaultConstructExplorerLink(
      "https://goerli.explorer.zksync.io"
    ),
    nativeCurrencySymbol: "ETH",
    pollingInterval: defaultBlockPollingInterval,
  },
  {
    name: "Base Goerli",
    fullName: "Base Testnet Goerli",
    chainId: ChainId.BASE_GOERLI,
    logoURI: baseLogo,
    rpcUrl: "https://goerli.base.org",
    explorerUrl: "https://goerli.basescan.org",
    constructExplorerLink: defaultConstructExplorerLink(
      "https://goerli.basescan.org"
    ),
    nativeCurrencySymbol: "ETH",
    pollingInterval: defaultBlockPollingInterval,
  },
];

export const chainInfoTable: ChainInfoTable = Object.fromEntries(
  chainInfoList.map((chain) => {
    return [chain.chainId, chain];
  }, [])
);

export type TokenInfo = {
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  logoURIs?: [string, string];
  // tokens require a mainnet address to do price lookups on coingecko, not used for anything else.
  mainnetAddress?: string;
  // optional display symbol for tokens that have a different symbol on the frontend
  displaySymbol?: string;
};
export type TokenInfoList = TokenInfo[];

export type ExternalLPTokenList = Array<
  TokenInfo & {
    provider: string;
    linkToLP: string;
  }
>;

export const externalLPsForStaking: Record<number, ExternalLPTokenList> = {
  1: [
    {
      name: "Balancer 50wstETH-50ACX",
      symbol: "50wstETH-50ACX",
      displaySymbol: "50wstETH-50ACX",
      decimals: 18,
      mainnetAddress: "0x36Be1E97eA98AB43b4dEBf92742517266F5731a3",
      logoURI: balLogo,
      provider: "balancer",
      linkToLP:
        "https://app.balancer.fi/#/ethereum/pool/0x36be1e97ea98ab43b4debf92742517266f5731a3000200000000000000000466",
      logoURIs: [
        acxLogo,
        "https://assets.coingecko.com/coins/images/18834/small/wstETH.png?1633565443",
      ],
    },
  ],
};

// Order of this map determines the order of the tokens in the token selector
export const orderedTokenSymbolLogoMap = {
  ETH: ethereumLogo,
  WETH: wethLogo,
  MATIC: polygonLogo,
  WMATIC: polygonLogo,
  USDC: usdcLogo,
  "USDC.e": usdcLogo,
  USDT: usdtLogo,
  DAI: daiLogo,
  WBTC: wbtcLogo,
  BAL: balLogo,
  UMA: umaLogo,
  ACX: acxLogo,
  SNX: snxLogo,
  POOL: pooltogetherLogo,
  BOBA: bobaLogo,
};

export const tokenList = [
  ...Object.entries(orderedTokenSymbolLogoMap).flatMap(([symbol, logoURI]) => {
    // NOTE: Handle edge case for Arbitrum and USDC combination.
    // We currently do not support native USDC on Arbitrum, only the bridged USDC.e token.
    // Until we do, we need to add a special case for USDC.e to the token list.
    if (symbol === "USDC.e") {
      const usdcTokenInfo = constants.TOKEN_SYMBOLS_MAP.USDC;
      return {
        ...usdcTokenInfo,
        logoURI,
        symbol: "USDC.e",
        displaySymbol: "USDC.e",
        mainnetAddress: usdcTokenInfo.addresses[hubPoolChainId],
      };
    }

    const tokenInfo =
      constants.TOKEN_SYMBOLS_MAP[
        symbol as keyof typeof constants.TOKEN_SYMBOLS_MAP
      ];

    if (!tokenInfo) {
      return [];
    }

    return {
      ...tokenInfo,
      logoURI,
      mainnetAddress: tokenInfo.addresses[hubPoolChainId],
    };
  }),
  ...externalLPsForStaking[hubPoolChainId],
];

// process.env variables
export const gasEstimationMultiplier = Number(
  process.env.REACT_APP_GAS_ESTIMATION_MULTIPLIER || 2
);
export const rewardsApiUrl =
  process.env.REACT_APP_REWARDS_API_URL || "https://api.across.to";
export const airdropWindowIndex = Number(
  process.env.REACT_APP_AIRDROP_WINDOW_INDEX || 0
);
export const referralsStartWindowIndex = Number(
  process.env.REACT_APP_REFERRALS_START_WINDOW_INDEX || airdropWindowIndex + 1
);
export const mediumUrl = process.env.REACT_APP_MEDIUM_URL;
export const disableDeposits = process.env.REACT_APP_DISABLE_DEPOSITS;
export const enableReactQueryDevTools =
  process.env.REACT_APP_ENABLE_REACT_QUERY_DEV_TOOLS;
export const infuraId =
  process.env.REACT_APP_PUBLIC_INFURA_ID || "e34138b2db5b496ab5cc52319d2f0299"; // Include this constant for testing
export const confirmations =
  Number(process.env.REACT_APP_PUBLIC_CONFIRMATIONS) || 1;
export const onboardApiKey = process.env.REACT_APP_PUBLIC_ONBOARD_API_KEY;
export const walletConnectProjectId =
  process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID!;
export const debug = Boolean(process.env.REACT_APP_DEBUG);
export const isProductionBuild = process.env.NODE_ENV === "production";
export const isAmplitudeLoggingEnabled =
  process.env.REACT_APP_AMPLITUDE_DEBUG_LOGGING === "true";

export const rewardsBannerWarning =
  process.env.REACT_APP_REWARDS_BANNER_WARNING;

export const MAX_APPROVAL_AMOUNT = ethers.constants.MaxUint256;
export const FEE_ESTIMATION = ".004";
export const MAX_RELAY_FEE_PERCENT = Number(
  process.env.REACT_APP_MAX_RELAY_FEE_PERCENT || 50
);
export const FLAT_RELAY_CAPITAL_FEE = process.env
  .REACT_APP_FLAT_RELAY_CAPITAL_FEE
  ? Number(process.env.REACT_APP_FLAT_RELAY_CAPITAL_FEE)
  : 0;
export const SHOW_ACX_NAV_TOKEN =
  process.env.REACT_APP_SHOW_ACX_NAV_TOKEN === "true";
export const AddressZero = ethers.constants.AddressZero;

assert(
  isSupportedChainId(hubPoolChainId),
  "Hubpool chain is not supported: " + hubPoolChainId
);
export function isSupportedChainId(chainId: number): chainId is ChainId {
  return chainId in ChainId;
}

export function getConfigStoreAddress(
  chainId: ChainId = hubPoolChainId
): string {
  const configStoreAddress = utils.getDeployedAddress(
    "AcrossConfigStore",
    chainId
  );
  assert(
    ethers.utils.isAddress(configStoreAddress),
    "Config Store address not set for chain: " + chainId
  );
  return configStoreAddress;
}

export function getChainInfo(chainId: number): ChainInfo {
  let chainInfo = chainInfoTable[chainId];

  if (!chainInfo) {
    let { name } = providers.getNetwork(chainId);
    name = name === "unknown" ? `Unknown (${chainId})` : name;

    chainInfo = {
      name,
      fullName: name,
      chainId,
      logoURI: unknownLogo,
      explorerUrl: "https://blockscan.com/",
      constructExplorerLink: (txHash: string) =>
        `https://blockscan.com/tx/${txHash}`,
      nativeCurrencySymbol: "ETH",
      pollingInterval: defaultBlockPollingInterval,
    };
  }

  return chainInfo;
}

export const tokenTable = Object.fromEntries(
  tokenList.map((token) => {
    return [token.symbol.toUpperCase(), token];
  })
);

export const getToken = (symbol: string): TokenInfo => {
  const token = tokenTable[symbol.toUpperCase()];
  assert(token, "No token found for symbol: " + symbol);
  return token;
};

/**
 * Resolves a token by address. This is useful for tokens that have multiple addresses on different chains.
 * @param address An address of a token
 * @returns The token info for the token with the given address
 */
export const getTokenByAddress = (address: string): TokenInfo => {
  const token = Object.values(constants.TOKEN_SYMBOLS_MAP).find((token) =>
    Object.values(token.addresses).includes(address)
  );
  assert(token, "No token found for address: " + address);
  return getToken(token.symbol);
};

const RouteSS = superstruct.object({
  fromChain: superstruct.number(),
  toChain: superstruct.number(),
  fromTokenAddress: superstruct.string(),
  fromSpokeAddress: superstruct.string(),
  fromTokenSymbol: superstruct.string(),
  isNative: superstruct.boolean(),
  l1TokenAddress: superstruct.string(),
});
const RoutesSS = superstruct.array(RouteSS);
const PoolSS = superstruct.object({
  tokenSymbol: superstruct.string(),
  isNative: superstruct.boolean(),
});
const PoolsSS = superstruct.array(PoolSS);
const RouteConfigSS = superstruct.type({
  routes: RoutesSS,
  pools: PoolsSS,
  hubPoolWethAddress: superstruct.string(),
  hubPoolChain: superstruct.number(),
  hubPoolAddress: superstruct.string(),
  acrossTokenAddress: superstruct.optional(superstruct.string()),
  acceleratingDistributorAddress: superstruct.optional(superstruct.string()),
  merkleDistributorAddress: superstruct.optional(superstruct.string()),
  claimAndStakeAddress: superstruct.optional(superstruct.string()),
});
export type RouteConfig = superstruct.Infer<typeof RouteConfigSS>;
export type Route = superstruct.Infer<typeof RouteSS>;
export type Routes = superstruct.Infer<typeof RoutesSS>;
export type Pool = superstruct.Infer<typeof PoolSS>;
export type Pools = superstruct.Infer<typeof PoolsSS>;
export function getRoutes(chainId: ChainId): RouteConfig {
  if (chainId === ChainId.MAINNET) {
    superstruct.assert(MainnetRoutes, RouteConfigSS);
    return MainnetRoutes;
  }
  if (chainId === ChainId.GOERLI) {
    superstruct.assert(GoerliRoutes, RouteConfigSS);
    return GoerliRoutes;
  }
  throw new Error("No routes defined for chainId: " + chainId);
}

export const routeConfig = getRoutes(hubPoolChainId);
export const hubPoolAddress = routeConfig.hubPoolAddress;
export const migrationPoolV2Warning =
  process.env.REACT_APP_MIGRATION_POOL_V2_WARNING === "true";
export const enableMigration = process.env.REACT_APP_ENABLE_MIGRATION;
export const generalMaintenanceMessage =
  process.env.REACT_APP_GENERAL_MAINTENANCE_MESSAGE;

export const bridgeDisabled = process.env.REACT_APP_BRIDGE_DISABLED === "true";

// Note: this address is used as the from address for simulated relay transactions on Optimism and Arbitrum since
// gas estimates require a live estimate and not a pre-configured gas amount. This address should be pre-loaded with
// a USDC approval for the _current_ spoke pools on Optimism (0x6f26Bf09B1C792e3228e5467807a900A503c0281) and Arbitrum
// (0xe35e9842fceaCA96570B734083f4a58e8F7C5f2A). It also has a small amount of USDC ($0.10) used for estimations.
// If this address lacks either of these, estimations will fail and relays to optimism and arbitrum will hang when
// estimating gas. Defaults to 0x893d0d70ad97717052e3aa8903d9615804167759 so the app can technically run without this.
export const dummyFromAddress =
  process.env.REACT_APP_DUMMY_FROM_ADDRESS ||
  "0x893d0d70ad97717052e3aa8903d9615804167759";

export const fixedPointAdjustment = parseEtherLike("1.0");

export const referrerDelimiterHex = "0xd00dfeeddeadbeef";

/**
 * The cushion applied to the total available liquidity when calculating the max amount of a token to relay.
 * This is to account for slippage and other factors that may cause the relay to fail.
 * This map takes the following format:
 * {
 *    "DAI": "100000",
 *    "DAI:1:10": "100001",
 * }
 * The key is the token symbol, and the value is the cushion in wei. If the key is a token symbol followed by a colon,
 * followed by an origin chain ID, followed by a colon, followed by a destination chain ID, then the cushion will only
 * apply to that specific route. For example, the key "DAI:1:10" will only apply to the DAI route from mainnet to
 * optimism.
 */
export const lpCushionMap: {
  [symbol: string]: string;
} = process.env.REACT_APP_LP_CUSHION_MAP
  ? JSON.parse(process.env.REACT_APP_LP_CUSHION_MAP)
  : {};

export function stringValueInArray(value: string, arr: string[]) {
  return arr.indexOf(value) !== -1;
}
export const maxRelayFee = 0.25; // 25%
export const minRelayFee = 0.0001; // 0.01%
// Chains where Blocknative Notify can be used. See https://docs.blocknative.com/notify#initialization
export const supportedNotifyChainIds = [1, 3, 4, 5, 42, 56, 100, 137, 250];

export const mockServerlessAPI =
  process.env.REACT_APP_MOCK_SERVERLESS === "true";

export const discordClientId = process.env.REACT_APP_DISCORD_CLIENT_ID ?? "";

// Configures the V2 breakpoints
export const BREAKPOINTS_V2 = {
  xs: 421,
  sm: 576,
  tb: 1024,
};
const breakpoint = (width: number) => ({
  andDown: `(max-width: ${width}px)`,
  andUp: `(min-width: ${width}px)`,
});
export const QUERIESV2 = {
  xs: breakpoint(BREAKPOINTS_V2.xs),
  sm: breakpoint(BREAKPOINTS_V2.sm),
  tb: breakpoint(BREAKPOINTS_V2.tb),
};

export const insideStorybookRuntime = Boolean(process.env.STORYBOOK);

export const rewardTiers = [
  {
    title: "Copper tier",
    titleSecondary: "40% referral rate",
    body: "Starting tier with no requirements to join.",
  },
  {
    title: "Bronze tier",
    titleSecondary: "50% referral rate",
    body: "Requires over $50,000 of bridge volume or 3 unique referral transfers.",
  },
  {
    title: "Silver tier",
    titleSecondary: "60% referral rate",
    body: "Requires over $100,000 of bridge volume or 5 unique referral transfers.",
  },
  {
    title: "Gold tier",
    titleSecondary: "70% referral rate",
    body: "Requires over $250,000 of bridge volume or 10 unique referral transfers.",
  },
  {
    title: "Platinum tier",
    titleSecondary: "80% referral rate",
    body: "Requires over $500,000 of bridge volume or 20 unique referral transfers.",
  },
];

export const secondsPerYear = 31557600;
export const secondsPerDay = 86400; // 60 sec/min * 60 min/hr * 24 hr/day

export const gasMultiplier = process.env.REACT_APP_GAS_ESTIMATION_MULTIPLIER
  ? Number(process.env.REACT_APP_GAS_ESTIMATION_MULTIPLIER)
  : undefined;

export const suggestedFeesDeviationBufferMultiplier = !Number.isNaN(
  Number(
    process.env.REACT_APP_SUGGESTED_FEES_DEVIATION_BUFFER_MULTIPLIER ||
      undefined
  )
)
  ? Number(process.env.REACT_APP_SUGGESTED_FEES_DEVIATION_BUFFER_MULTIPLIER)
  : 1.25;

export const defaultRefetchInterval = 15_000;

export const fallbackSuggestedRelayerFeePct = ethers.utils.parseEther("0.0001");

export const amplitudeAPIKey = process.env.REACT_APP_AMPLITUDE_KEY
  ? process.env.REACT_APP_AMPLITUDE_KEY
  : undefined;

export const amplitudeServerUrl = process.env.REACT_APP_AMPLITUDE_SERVER_URL
  ? process.env.REACT_APP_AMPLITUDE_SERVER_URL
  : undefined;

export const currentGitCommitHash = process.env.REACT_APP_GIT_COMMIT_HASH ?? "";

export const CACHED_WALLET_KEY = "previous-wallet-service";

export const sentryEnv = process.env.REACT_APP_SENTRY_ENV;
export const sentryDsn = process.env.REACT_APP_SENTRY_DSN;
export const isSentryEnabled = Boolean(
  process.env.REACT_APP_ENABLE_SENTRY === "true"
);

export const defaultBridgeFromChainId = hubPoolChainId;
export const defaultBridgeToChainId = hubPoolChainId === 1 ? 10 : 5;

export const disabledBridgeTokens = String(
  process.env.REACT_APP_DISABLED_BRIDGE_TOKENS || ""
)
  .split(",")
  .map((symbol) => symbol.toUpperCase());

export const disabledChainIds = (
  process.env.REACT_APP_DISABLED_CHAINS || ""
).split(",");

export const disabledChainIdsForAvailableRoutes = (
  process.env.REACT_APP_DISABLED_CHAINS_FOR_AVAILABLE_ROUTES || ""
).split(",");

export const walletBlacklist = (process.env.REACT_APP_WALLET_BLACKLIST || "")
  .split(",")
  .map((address) => address.toLowerCase());
