import assert from "assert";
import { BigNumber, ethers, providers } from "ethers";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "@across-protocol/constants";
import * as superstruct from "superstruct";

import { parseEtherLike } from "./format";
import { isBridgedUsdc } from "./sdk";

import unknownLogo from "assets/icons/question-circle.svg";
import { ReactComponent as unknownLogoSvg } from "assets/icons/question-circle.svg";
import OPCloudBackground from "assets/bg-banners/op-cloud-rebate.svg";
import ARBCloudBackground from "assets/bg-banners/arb-cloud-rebate.svg";

// all routes should be pre imported to be able to switch based on chain id
import MainnetRoutes from "data/routes_1_0xc186fA914353c44b2E33eBE05f21846F1048bEda.json";
import SepoliaRoutes from "data/routes_11155111_0x14224e63716afAcE30C9a417E0542281869f7d9e.json";
import { Deposit } from "hooks/useDeposits";

import {
  ChainId,
  ChainInfo,
  ChainInfoList,
  ChainInfoTable,
  chainInfoList,
  chainInfoTable,
} from "../constants/chains";
import {
  TokenInfo,
  TokenInfoList,
  orderedTokenLogos,
  interchangeableTokensMap,
  similarTokensMap,
} from "../constants/tokens";
import { ExternalLPTokenList, externalLPsForStaking } from "../constants/pools";
import { externConfigs } from "constants/chains/configs";

export type {
  TokenInfo,
  TokenInfoList,
  ExternalLPTokenList,
  ChainInfo,
  ChainInfoList,
  ChainInfoTable,
};
export {
  TOKEN_SYMBOLS_MAP,
  externalLPsForStaking,
  chainInfoList,
  chainInfoTable,
  ChainId,
  interchangeableTokensMap,
  similarTokensMap,
};

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

export const defaultBlockPollingInterval =
  Number(process.env.REACT_APP_DEFAULT_BLOCK_POLLING_INTERVAL_S || 15) * 1000;
export const hubPoolChainId = Number(
  process.env.REACT_APP_HUBPOOL_CHAINID || 1
);

export const tokenList = [
  ...Object.entries(orderedTokenLogos).flatMap(([symbol, logoURI]) => {
    const tokenInfo =
      TOKEN_SYMBOLS_MAP[symbol as keyof typeof TOKEN_SYMBOLS_MAP];

    if (!tokenInfo) {
      return [];
    }

    return {
      ...tokenInfo,
      displaySymbol: symbol,
      logoURI,
      mainnetAddress: isBridgedUsdc(tokenInfo.symbol)
        ? TOKEN_SYMBOLS_MAP.USDC.addresses[hubPoolChainId]
        : tokenInfo.addresses[hubPoolChainId],
    };
  }),
  ...externalLPsForStaking[hubPoolChainId],
];

export type rewardProgramTypes = "op-rebates" | "arb-rebates";
export type rewardProgramValues = {
  programName: string;
  primaryColor: keyof typeof COLORS;
  url: string;
  rewardTokenSymbol: string;
  backgroundUrl: string;
  highestPct: number;
  claimableTooltipBody: string;
  ctaBody?: (chainId: number) => string;
  enabledChains: ChainId[];
};
export const rewardPrograms: Record<rewardProgramTypes, rewardProgramValues> = {
  "op-rebates": {
    programName: "OP Rewards Program",
    primaryColor: "op-red",
    url: "/rewards/optimism-grant-program",
    rewardTokenSymbol: "OP",
    backgroundUrl: OPCloudBackground,
    highestPct: 0.95,
    ctaBody: (chainId: number) =>
      `Bridge to ${getChainInfo(chainId).name} and earn on every transaction.`,
    claimableTooltipBody:
      "OP rewards earned during the month can be claimed at the end of the following month.",
    enabledChains: [
      ChainId.ZORA,
      ChainId.REDSTONE,
      ChainId.OPTIMISM,
      ChainId.MODE,
      ChainId.BASE,
      ChainId.INK,
      ChainId.WORLD_CHAIN,
      ChainId.LISK,
      ChainId.SONEIUM,
    ],
  },
  "arb-rebates": {
    programName: "Arbitrum Rewards Program",
    primaryColor: "arb-blue",
    url: "/rewards/arbitrum-grant-program",
    rewardTokenSymbol: "ARB",
    backgroundUrl: ARBCloudBackground,
    highestPct: 0.95,
    ctaBody: () => "Bridge to Arbitrum and earn on every transaction.",
    claimableTooltipBody:
      "Arbitrum rewards earned during the month can be claimed at the end of the following month.",
    enabledChains: [],
  },
};

export const chainIdToRewardsProgramName = Object.entries(
  rewardPrograms
).reduce(
  (acc, [key, { enabledChains }]) => {
    enabledChains.forEach((chainId) => {
      acc[chainId] = key as rewardProgramTypes;
    });
    return acc;
  },
  {} as Record<ChainId, rewardProgramTypes>
);

// process.env variables
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
export const rewardProgramsAvailable: (keyof typeof rewardPrograms)[] = (
  String(process.env.REACT_APP_REBATE_PROGRAMS_AVAILABLE || "")
    .toLowerCase()
    .split(",") as (keyof typeof rewardPrograms)[]
).filter((v) => v);
export const rewardsBannerWarning =
  process.env.REACT_APP_REWARDS_BANNER_WARNING;

export const MAX_APPROVAL_AMOUNT = ethers.constants.MaxUint256;
export const FEE_ESTIMATION = ".004";
export const MAX_RELAY_FEE_PERCENT = Number(
  process.env.REACT_APP_MAX_RELAY_FEE_PERCENT || 50
);
export const SHOW_ACX_NAV_TOKEN =
  process.env.REACT_APP_SHOW_ACX_NAV_TOKEN === "true";
export const AddressZero = ethers.constants.AddressZero;

assert(
  isSupportedChainId(hubPoolChainId),
  "Hubpool chain is not supported: " + hubPoolChainId
);
export function isSupportedChainId(chainId: number) {
  return Object.values(CHAIN_IDs).includes(chainId);
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
      grayscaleLogoURI: unknownLogo,
      logoSvg: unknownLogoSvg,
      grayscaleLogoSvg: unknownLogoSvg,
      explorerUrl: "https://blockscan.com/",
      constructExplorerLink: (txHash: string) =>
        `https://blockscan.com/tx/${txHash}`,
      nativeCurrencySymbol: "ETH",
      pollingInterval: defaultBlockPollingInterval,
      rpcUrl: "https://rpc.com",
      customRpcUrl: "https://rpc.com",
    };
  }

  return chainInfo;
}

export const chainEndpointToId = Object.fromEntries(
  chainInfoList.map((chain) => {
    const projects = Object.values(externConfigs).filter(
      ({ intermediaryChain }) => intermediaryChain === chain.chainId
    );
    return [
      chain.name.toLowerCase().replaceAll(" ", ""),
      {
        chainId: chain.chainId,
        associatedProjectIds: projects.map(({ projectId }) => projectId),
      },
    ];
  }, [])
);

// For destination chains with no native ETH support, we will send WETH even if the receiver is an EOA
export const nonEthChains = [
  ChainId.POLYGON,
  ChainId.POLYGON_AMOY,
  ChainId.ALEPH_ZERO,
  ChainId.LENS_SEPOLIA,
];

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

export const getRewardToken = (deposit: Deposit): TokenInfo | undefined => {
  if (!deposit.rewards) {
    return undefined;
  }
  const rewardType = deposit.rewards.type;
  const symbol =
    rewardType === "op-rebates"
      ? "OP"
      : rewardType === "arb-rebates"
        ? "ARB"
        : "ACX";
  return getToken(symbol);
};

/**
 * Resolves a token by address. This is useful for tokens that have multiple addresses on different chains.
 * @param address An address of a token
 * @returns The token info for the token with the given address
 */
export const getTokenByAddress = (address: string): TokenInfo => {
  const token = Object.values(tokenTable).find(
    (token) =>
      Object.values(token?.addresses ?? {}).includes(address) ||
      token?.mainnetAddress === address
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
  toTokenAddress: superstruct.string(),
  toTokenSymbol: superstruct.string(),
  isNative: superstruct.boolean(),
  l1TokenAddress: superstruct.string(),
  externalProjectId: superstruct.optional(superstruct.string()),
});
const RoutesSS = superstruct.array(RouteSS);
const SwapRouteSS = superstruct.assign(
  RouteSS,
  superstruct.object({
    swapTokenAddress: superstruct.string(),
    swapTokenSymbol: superstruct.string(),
    swapTokenL1TokenAddress: superstruct.string(),
  })
);
const SwapRoutesSS = superstruct.array(SwapRouteSS);
const PoolSS = superstruct.object({
  tokenSymbol: superstruct.string(),
  isNative: superstruct.boolean(),
});
const SpokePoolVerifierSS = superstruct.object({
  enabledChains: superstruct.array(superstruct.number()),
  address: superstruct.string(),
});
const SwapAndBridgeAddressesSS = superstruct.record(
  superstruct.string(),
  superstruct.record(superstruct.string(), superstruct.string())
);
const PoolsSS = superstruct.array(PoolSS);
const RouteConfigSS = superstruct.type({
  routes: RoutesSS,
  swapRoutes: SwapRoutesSS,
  pools: PoolsSS,
  spokePoolVerifier: SpokePoolVerifierSS,
  hubPoolWethAddress: superstruct.string(),
  hubPoolChain: superstruct.number(),
  hubPoolAddress: superstruct.string(),
  acrossTokenAddress: superstruct.optional(superstruct.string()),
  acceleratingDistributorAddress: superstruct.optional(superstruct.string()),
  merkleDistributorAddress: superstruct.optional(superstruct.string()),
  claimAndStakeAddress: superstruct.optional(superstruct.string()),
  configStoreAddress: superstruct.optional(superstruct.string()),
  swapAndBridgeAddresses: superstruct.optional(SwapAndBridgeAddressesSS),
});
export type RouteConfig = superstruct.Infer<typeof RouteConfigSS>;
export type Route = superstruct.Infer<typeof RouteSS>;
export type Routes = superstruct.Infer<typeof RoutesSS>;
export type SwapRoute = superstruct.Infer<typeof SwapRouteSS>;
export type SwapRoutes = superstruct.Infer<typeof SwapRoutesSS>;
export type Pool = superstruct.Infer<typeof PoolSS>;
export type Pools = superstruct.Infer<typeof PoolsSS>;
export type SpokePoolVerifier = superstruct.Infer<typeof SpokePoolVerifierSS>;
export function getRoutes(chainId: ChainId): RouteConfig {
  if (chainId === ChainId.MAINNET) {
    superstruct.assert(MainnetRoutes, RouteConfigSS);
    return MainnetRoutes;
  }
  if (chainId === ChainId.SEPOLIA) {
    superstruct.assert(SepoliaRoutes, RouteConfigSS);
    return SepoliaRoutes;
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

// See src/components/GlobalStyles/GlobalStyles.tsx for the CSS variables
export const COLORS = {
  red: "var(--color-interface-red)",
  "op-red": "var(--color-interface-op-red)",
  "op-red-5": "var(--color-interface-op-red-5)",
  "op-red-15": "var(--color-interface-op-red-15)",
  "arb-blue": "var(--color-interface-arb-blue)",
  "arb-blue-5": "var(--color-interface-arb-blue-5)",
  "arb-blue-15": "var(--color-interface-arb-blue-15)",
  yellow: "var(--color-interface-yellow)",
  aqua: "var(--color-interface-aqua)",
  "aqua-0": "var(--color-interface-aqua-0)",
  "aqua-5": "var(--color-interface-aqua-5)",
  "aqua-15": "var(--color-interface-aqua-15)",
  teal: "var(--color-interface-teal)",
  "teal-0": "var(--color-interface-teal-0)",
  "teal-5": "var(--color-interface-teal-5)",
  "teal-15": "var(--color-interface-teal-15)",
  "black-700": "var(--color-neutrals-black-700)",
  "black-800": "var(--color-neutrals-black-800)",
  "black-900": "var(--color-neutrals-black-900)",
  "grey-400": "var(--color-neutrals-grey-400)",
  "grey-400-15": "var(--color-neutrals-grey-400-15)",
  "grey-400-5": "var(--color-neutrals-grey-400-5)",
  "grey-500": "var(--color-neutrals-grey-500)",
  "grey-600": "var(--color-neutrals-grey-600)",
  "grey-650": "var(--color-neutrals-grey-650)",
  "light-100": "var(--color-neutrals-light-100)",
  "light-200": "var(--color-neutrals-light-200)",
  "light-300": "var(--color-neutrals-light-300)",
  "light-blue-200": "var(--color-neutrals-blue-200)",
  "white-70": "var(--tints-shades-white-70)",
  "white-88": "var(--tints-shades-white-88)",
  "white-100": "var(--tints-shades-white-100)",
  "white-200": "var(--tints-shades-white-200)",

  // Aliases
  primary: "var(--color-interface-aqua)",
  brand: "var(--color-interface-aqua)",
  error: "var(--color-interface-red)",
  warning: "var(--color-interface-yellow)",
  white: "var(--color-interface-white)",
  "dark-grey": "var(--color-neutrals-black-800)",
};

export const insideStorybookRuntime = Boolean(process.env.STORYBOOK);

export const secondsPerYear = 31557600;
export const secondsPerDay = 86400; // 60 sec/min * 60 min/hr * 24 hr/day

export const gasMultiplierPerChain: Record<string, number> = process.env
  .REACT_APP_GAS_ESTIMATION_MULTIPLIER_PER_CHAIN
  ? JSON.parse(process.env.REACT_APP_GAS_ESTIMATION_MULTIPLIER_PER_CHAIN)
  : {};

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

export const disabledTokensForAvailableRoutes = (
  process.env.REACT_APP_DISABLED_TOKENS_FOR_AVAILABLE_ROUTES || ""
).split(",");

export const walletBlacklist = (process.env.REACT_APP_WALLET_BLACKLIST || "")
  .split(",")
  .map((address) => address.toLowerCase());

// Pre-computed gas expenditure for deposits used for estimations
export const gasExpenditureDeposit = BigNumber.from(90_000);

// Used to determine whether to show the "delayed" warning in the deposits table
export const pendingStateTimeUntilDelayed = 5 * 60; // 5 mins

export const vercelApiBaseUrl =
  process.env.REACT_APP_VERCEL_API_BASE_URL_OVERRIDE || "";

// Swap slippage in %, 0.5 = 0.5%
export const defaultSwapSlippage = Number(
  process.env.REACT_APP_DEFAULT_SWAP_SLIPPAGE || 0.5
);

export const indexerApiBaseUrl =
  process.env.REACT_APP_INDEXER_BASE_URL || undefined;

export const hyperLiquidBridge2Address =
  "0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7";

export const acrossPlusMulticallHandler: Record<number, string> = {
  [CHAIN_IDs.ARBITRUM]: "0x924a9f036260DdD5808007E1AA95f08eD08aA569",
};
