import assert from "assert";
import { BigNumber, ethers, providers } from "ethers";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "@across-protocol/constants";
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
import lineaLogo from "assets/linea-logo.svg";
import modeLogo from "assets/mode-logo.svg";
import usdcLogo from "assets/usdc.svg";
import daiLogo from "assets/dai.svg";
import wbtcLogo from "assets/wbtc.svg";
import umaLogo from "assets/uma.svg";
import acxLogo from "assets/acx.svg";
import balLogo from "assets/bal.svg";
import usdtLogo from "assets/usdt-logo.svg";
import snxLogo from "assets/snx-logo.svg";
import pooltogetherLogo from "assets/pooltogether-logo.svg";
import unknownLogo from "assets/icons/question-circle.svg";
import ACXCloudBackground from "assets/bg-banners/cloud-staking.svg";
import OPCloudBackground from "assets/bg-banners/op-cloud-rebate.svg";
import ARBCloudBackground from "assets/bg-banners/arb-cloud-rebate.svg";

// all routes should be pre imported to be able to switch based on chain id
import MainnetRoutes from "data/routes_1_0xc186fA914353c44b2E33eBE05f21846F1048bEda.json";
import SepoliaRoutes from "data/routes_11155111_0x14224e63716afAcE30C9a417E0542281869f7d9e.json";
import { Deposit } from "hooks/useDeposits";

export { TOKEN_SYMBOLS_MAP };

/* Chains and Tokens section */
export enum ChainId {
  MAINNET = CHAIN_IDs.MAINNET,
  OPTIMISM = CHAIN_IDs.OPTIMISM,
  ARBITRUM = CHAIN_IDs.ARBITRUM,
  POLYGON = CHAIN_IDs.POLYGON,
  ZK_SYNC = CHAIN_IDs.ZK_SYNC,
  BASE = CHAIN_IDs.BASE,
  LINEA = CHAIN_IDs.LINEA,
  MODE = CHAIN_IDs.MODE,
  // testnets
  SEPOLIA = CHAIN_IDs.SEPOLIA,
  BASE_SEPOLIA = CHAIN_IDs.BASE_SEPOLIA,
  OPTIMISM_SEPOLIA = CHAIN_IDs.OPTIMISM_SEPOLIA,
  ARBITRUM_SEPOLIA = CHAIN_IDs.ARBITRUM_SEPOLIA,
  MODE_SEPOLIA = CHAIN_IDs.MODE_SEPOLIA,
  POLYGON_AMOY = CHAIN_IDs.POLYGON_AMOY,
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

export type ChainInfo = {
  name: string;
  fullName?: string;
  chainId: ChainId;
  logoURI: string;
  rpcUrl?: string;
  customRpcUrl?: string;
  explorerUrl: string;
  constructExplorerLink: (txHash: string) => string;
  pollingInterval: number;
  nativeCurrencySymbol: string;
};

export type ChainInfoList = ChainInfo[];
export type ChainInfoTable = Record<number, ChainInfo>;

export const defaultBlockPollingInterval =
  Number(process.env.REACT_APP_DEFAULT_BLOCK_POLLING_INTERVAL_S || 15) * 1000;
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
    customRpcUrl: process.env.REACT_APP_CHAIN_1_PROVIDER_URL,
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
    customRpcUrl: process.env.REACT_APP_CHAIN_42161_PROVIDER_URL,
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
    customRpcUrl: process.env.REACT_APP_CHAIN_10_PROVIDER_URL,
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
    customRpcUrl: process.env.REACT_APP_CHAIN_137_PROVIDER_URL,
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
    pollingInterval: 10_000,
    customRpcUrl: process.env.REACT_APP_CHAIN_324_PROVIDER_URL,
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
    pollingInterval: 10_000,
    customRpcUrl: process.env.REACT_APP_CHAIN_8453_PROVIDER_URL,
  },
  {
    name: "Linea",
    fullName: "Linea",
    chainId: ChainId.LINEA,
    logoURI: lineaLogo,
    rpcUrl: "https://rpc.linea.build",
    explorerUrl: "https://lineascan.build",
    constructExplorerLink: defaultConstructExplorerLink(
      "https://lineascan.build"
    ),
    nativeCurrencySymbol: "ETH",
    pollingInterval: 10_000,
    customRpcUrl: process.env.REACT_APP_CHAIN_59144_PROVIDER_URL,
  },
  {
    name: "Mode",
    fullName: "Mode",
    chainId: ChainId.MODE,
    logoURI: modeLogo,
    rpcUrl: "https://mainnet.mode.network",
    explorerUrl: "https://modescan.io",
    constructExplorerLink: defaultConstructExplorerLink("https://modescan.io"),
    nativeCurrencySymbol: "ETH",
    pollingInterval: 10_000,
    customRpcUrl: process.env.REACT_APP_CHAIN_34443_PROVIDER_URL,
  },
  // testnets
  {
    name: "Sepolia",
    fullName: "Sepolia",
    chainId: ChainId.SEPOLIA,
    logoURI: ethereumLogo,
    rpcUrl: "https://gateway.tenderly.co/public/sepolia	",
    explorerUrl: "https://sepolia.etherscan.io/",
    constructExplorerLink: defaultConstructExplorerLink(
      "https://sepolia.etherscan.io/"
    ),
    nativeCurrencySymbol: "ETH",
    pollingInterval: defaultBlockPollingInterval,
    customRpcUrl: process.env.REACT_APP_CHAIN_11155111_PROVIDER_URL,
  },
  {
    name: "Base Sepolia",
    fullName: "Base Testnet Sepolia",
    chainId: ChainId.BASE_SEPOLIA,
    logoURI: baseLogo,
    rpcUrl: "https://sepolia.base.org",
    explorerUrl: "https://base-sepolia.blockscout.com/",
    constructExplorerLink: defaultConstructExplorerLink(
      "https://base-sepolia.blockscout.com/"
    ),
    nativeCurrencySymbol: "ETH",
    pollingInterval: defaultBlockPollingInterval,
    customRpcUrl: process.env.REACT_APP_CHAIN_84532_PROVIDER_URL,
  },
  {
    name: "Arbitrum Sepolia",
    fullName: "Arbitrum Testnet Sepolia",
    chainId: ChainId.ARBITRUM_SEPOLIA,
    logoURI: arbitrumLogo,
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    explorerUrl: "https://sepolia.arbiscan.io",
    constructExplorerLink: defaultConstructExplorerLink(
      "https://sepolia.arbiscan.io"
    ),
    nativeCurrencySymbol: "ETH",
    pollingInterval: defaultBlockPollingInterval,
    customRpcUrl: process.env.REACT_APP_CHAIN_421614_PROVIDER_URL,
  },
  {
    name: "Optimism Sepolia",
    fullName: "Optimism Testnet Sepolia",
    chainId: ChainId.OPTIMISM_SEPOLIA,
    logoURI: optimismLogo,
    rpcUrl: "https://sepolia.optimism.io",
    explorerUrl: "https://sepolia-optimism.etherscan.io",
    constructExplorerLink: defaultConstructExplorerLink(
      "https://sepolia-optimism.etherscan.io"
    ),
    nativeCurrencySymbol: "ETH",
    pollingInterval: defaultBlockPollingInterval,
    customRpcUrl: process.env.REACT_APP_CHAIN_11155420_PROVIDER_URL,
  },
  {
    name: "Mode Sepolia",
    fullName: "Mode Testnet Sepolia",
    chainId: ChainId.MODE_SEPOLIA,
    logoURI: modeLogo,
    rpcUrl: "https://sepolia.mode.network",
    explorerUrl: "https://testnet.modescan.io",
    constructExplorerLink: defaultConstructExplorerLink(
      "https://testnet.modescan.io"
    ),
    nativeCurrencySymbol: "ETH",
    pollingInterval: 10_000,
    customRpcUrl: process.env.REACT_APP_CHAIN_919_PROVIDER_URL,
  },
  {
    name: "Polygon Amoy",
    fullName: "Polygon Testnet Amoy",
    chainId: ChainId.POLYGON_AMOY,
    logoURI: polygonLogo,
    rpcUrl: "https://rpc-amoy.polygon.technology",
    explorerUrl: "https://amoy.polygonscan.com",
    constructExplorerLink: defaultConstructExplorerLink(
      "https://amoy.polygonscan.com"
    ),
    nativeCurrencySymbol: "MATIC",
    pollingInterval: defaultBlockPollingInterval,
    customRpcUrl: process.env.REACT_APP_CHAIN_80002_PROVIDER_URL,
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
  addresses?: Record<number, string>;
};
export type TokenInfoList = TokenInfo[];

export type ExternalLPTokenList = Array<
  TokenInfo & {
    provider: string;
    linkToLP: string;
  }
>;

export const externalLPsForStaking: Record<number, ExternalLPTokenList> = {
  [CHAIN_IDs.MAINNET]: [
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
  [CHAIN_IDs.SEPOLIA]: [],
};

export const bridgedUSDCSymbolsMap = {
  [ChainId.ARBITRUM]: "USDC.e",
  [ChainId.OPTIMISM]: "USDC.e",
  [ChainId.POLYGON]: "USDC.e",
  [ChainId.ZK_SYNC]: "USDC.e",
  [ChainId.BASE]: "USDbC",
};
export const bridgedUSDCSymbols = Array.from(
  new Set(Object.values(bridgedUSDCSymbolsMap)).values()
);
export const chainsWithNativeUSDC = Object.keys(bridgedUSDCSymbolsMap).map(
  Number
);
export function isBridgedUsdc(symbol: string) {
  return bridgedUSDCSymbols.includes(symbol);
}

// Order of this map determines the order of the tokens in the token selector
export const orderedTokenSymbolLogoMap = {
  ETH: ethereumLogo,
  WETH: wethLogo,
  MATIC: polygonLogo,
  WMATIC: polygonLogo,
  USDC: usdcLogo,
  "USDC.e": usdcLogo,
  USDbC: usdcLogo,
  USDT: usdtLogo,
  DAI: daiLogo,
  WBTC: wbtcLogo,
  BAL: balLogo,
  UMA: umaLogo,
  ACX: acxLogo,
  SNX: snxLogo,
  POOL: pooltogetherLogo,
  BOBA: bobaLogo,
  OP: optimismLogo,
  ARB: arbitrumLogo,
};

export const tokenList = [
  ...Object.entries(orderedTokenSymbolLogoMap).flatMap(([symbol, logoURI]) => {
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

export type rewardProgramTypes = "referrals" | "op-rebates" | "arb-rebates";
export const rewardPrograms: Record<
  rewardProgramTypes,
  {
    programName: string;
    primaryColor: keyof typeof COLORS;
    url: string;
    rewardTokenSymbol: string;
    backgroundUrl: string;
    highestPct: number;
    claimableTooltipBody: string;
    ctaBody?: string;
  }
> = {
  referrals: {
    programName: "Across Referral Program",
    primaryColor: "aqua",
    url: "/rewards/referrals",
    rewardTokenSymbol: "ACX",
    backgroundUrl: ACXCloudBackground,
    highestPct: 0.8,
    claimableTooltipBody:
      "ACX referral rewards earned during the month are made claimable after the ~15th of the following month",
  },
  "op-rebates": {
    programName: "OP Rewards Program",
    primaryColor: "op-red",
    url: "/rewards/optimism-grant-program",
    rewardTokenSymbol: "OP",
    backgroundUrl: OPCloudBackground,
    highestPct: 0.95,
    ctaBody: "Bridge to Optimism and earn on every transaction.",
    claimableTooltipBody:
      "OP rewards earned during the month are made claimable after the ~15th of the following month",
  },
  "arb-rebates": {
    programName: "Arbitrum Rewards Program",
    primaryColor: "arb-blue",
    url: "/rewards/arbitrum-grant-program",
    rewardTokenSymbol: "ARB",
    backgroundUrl: ARBCloudBackground,
    highestPct: 0.95,
    ctaBody: "Bridge to Arbitrum and earn on every transaction.",
    claimableTooltipBody:
      "Arbitrum rewards earned during the month are made claimable after the ~15th of the following month",
  },
};

export const chainIdToRewardsProgramName = {
  [ChainId.OPTIMISM]: "op-rebates",
  [ChainId.OPTIMISM_SEPOLIA]: "op-rebates",
  [ChainId.ARBITRUM]: "arb-rebates",
  [ChainId.ARBITRUM_SEPOLIA]: "arb-rebates",
} as const;

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
export const rewardProgramsAvailable: (keyof typeof rewardPrograms)[] = [
  // Our referrals program is always available
  "referrals",
  ...(
    String(process.env.REACT_APP_REBATE_PROGRAMS_AVAILABLE || "")
      .toLowerCase()
      .split(",") as (keyof typeof rewardPrograms)[]
  ).filter((v) => v),
];
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
export function isSupportedChainId(chainId: number): chainId is ChainId {
  return chainId in ChainId;
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
  const token = Object.values(TOKEN_SYMBOLS_MAP).find((token) =>
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
  toTokenAddress: superstruct.string(),
  toTokenSymbol: superstruct.string(),
  isNative: superstruct.boolean(),
  l1TokenAddress: superstruct.string(),
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

export const rewardTiers = [
  {
    title: "Copper tier",
    titleSecondary: "40% referral rate",
    body: "Starting tier with no requirements to join.",
    name: "Copper",
    referralRate: 0.4,
    referrals: 0,
    volume: 0,
  },
  {
    title: "Bronze tier",
    titleSecondary: "50% referral rate",
    body: "Requires over $50,000 of bridge volume or 3 unique referral transfers.",
    name: "Bronze",
    referralRate: 0.5,
    referrals: 3,
    volume: 50000,
  },
  {
    title: "Silver tier",
    titleSecondary: "60% referral rate",
    body: "Requires over $100,000 of bridge volume or 5 unique referral transfers.",
    name: "Silver",
    referralRate: 0.6,
    referrals: 5,
    volume: 100000,
  },
  {
    title: "Gold tier",
    titleSecondary: "70% referral rate",
    body: "Requires over $250,000 of bridge volume or 10 unique referral transfers.",
    name: "Gold",
    referralRate: 0.7,
    referrals: 10,
    volume: 250000,
  },
  {
    title: "Platinum tier",
    titleSecondary: "80% referral rate",
    body: "Requires over $500,000 of bridge volume or 20 unique referral transfers.",
    name: "Platinum",
    referralRate: 0.8,
    referrals: 20,
    volume: 500000,
  },
];

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
