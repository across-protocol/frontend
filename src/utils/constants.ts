import assert from "assert";
import { ethers } from "ethers";
import ethereumLogo from "assets/ethereum-logo.svg";
import optimismLogo from "assets/optimism-alt-logo.svg";
import wethLogo from "assets/weth-logo.svg";
import arbitrumLogo from "assets/arbitrum-logo.svg";
import bobaLogo from "assets/boba-logo.svg";
import polygonLogo from "assets/polygon-logo.svg";
import { getAddress } from "./address";
import * as superstruct from "superstruct";
import { relayFeeCalculator } from "@across-protocol/sdk-v2";
import { across } from "@uma/sdk";

// all routes should be pre imported to be able to switch based on chain id
import KovanRoutes from "data/routes_42_0x8d84F51710dfa9D409027B167371bBd79e0539e5.json";
import MainnetRoutes from "data/routes_1_0xc186fA914353c44b2E33eBE05f21846F1048bEda.json";
import GoerliRoutes from "data/routes_5_0xA44A832B994f796452e4FaF191a041F791AD8A0A.json";
import { parseEtherLike } from "./format";

/* Chains and Tokens section */
export enum ChainId {
  MAINNET = 1,
  OPTIMISM = 10,
  ARBITRUM = 42161,
  BOBA = 288,
  POLYGON = 137,
  // testnets
  RINKEBY = 4,
  KOVAN = 42,
  KOVAN_OPTIMISM = 69,
  ARBITRUM_RINKEBY = 421611,
  GOERLI = 5,
  // Polygon testnet
  MUMBAI = 80001,
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

// Update once addresses are known
export const configStoreAddresses: Record<ChainId, string> = {
  [ChainId.MAINNET]: getAddress("0x3B03509645713718B78951126E0A6de6f10043f5"),
  [ChainId.ARBITRUM]: ethers.constants.AddressZero,
  [ChainId.OPTIMISM]: ethers.constants.AddressZero,
  [ChainId.BOBA]: ethers.constants.AddressZero,
  [ChainId.POLYGON]: ethers.constants.AddressZero,
  [ChainId.RINKEBY]: ethers.constants.AddressZero,
  [ChainId.KOVAN]: getAddress("0xDd74f7603e3fDA6435aEc91F8960a6b8b40415f3"),
  [ChainId.KOVAN_OPTIMISM]: ethers.constants.AddressZero,
  [ChainId.ARBITRUM_RINKEBY]: ethers.constants.AddressZero,
  [ChainId.GOERLI]: getAddress("0x3215e3C91f87081757d0c41EF0CB77738123Be83"),
  [ChainId.MUMBAI]: ethers.constants.AddressZero,
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
  earliestBlock: number;
};

export type ChainInfoList = ChainInfo[];
export type ChainInfoTable = Record<number, ChainInfo>;
export const defaultBlockPollingInterval =
  Number(process.env.REACT_APP_DEFAULT_BLOCK_POLLING_INTERVAL_S || 30) * 1000;

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
    earliestBlock: 14704425,
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
    earliestBlock: 11102271,
  },
  {
    name: "Boba",
    chainId: ChainId.BOBA,
    logoURI: bobaLogo,
    rpcUrl: "https://mainnet.boba.network",
    explorerUrl: "https://blockexplorer.boba.network",
    constructExplorerLink: (txHash: string) =>
      `https://blockexplorer.boba.network/tx/${txHash}`,
    nativeCurrencySymbol: "ETH",
    pollingInterval: defaultBlockPollingInterval,
    earliestBlock: 551955,
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
    earliestBlock: 6979967,
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
    earliestBlock: 27875891,
  },
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
    earliestBlock: 6586188,
  },
  {
    name: "Kovan",
    fullName: "Ethereum Testnet Kovan",
    chainId: ChainId.KOVAN,
    logoURI: ethereumLogo,
    explorerUrl: "https://kovan.etherscan.io",
    constructExplorerLink: defaultConstructExplorerLink(
      "https://kovan.etherscan.io"
    ),
    nativeCurrencySymbol: "KOV",
    pollingInterval: defaultBlockPollingInterval,
    earliestBlock: 31457386,
  },
  {
    name: "Optimism Kovan",
    fullName: "Optimism Testnet Kovan",
    chainId: ChainId.KOVAN_OPTIMISM,
    logoURI: optimismLogo,
    rpcUrl: "https://kovan.optimism.io",
    explorerUrl: "https://kovan-optimistic.etherscan.io",
    constructExplorerLink: (txHash: string) =>
      `https://kovan-optimistic.etherscan.io/tx/${txHash}`,
    nativeCurrencySymbol: "KOR",
    pollingInterval: defaultBlockPollingInterval,
    earliestBlock: 2537971,
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
    earliestBlock: 25751326,
  },
  {
    name: "Arbitrum Rinkeby",
    fullName: "Arbitrum Testnet Rinkeby",
    chainId: ChainId.ARBITRUM_RINKEBY,
    logoURI: arbitrumLogo,
    explorerUrl: "https://rinkeby-explorer.arbitrum.io",
    constructExplorerLink: (txHash: string) =>
      `https://rinkeby-explorer.arbitrum.io/tx/${txHash}`,
    rpcUrl: "https://rinkeby.arbitrum.io/rpc",
    nativeCurrencySymbol: "ARETH",
    pollingInterval: defaultBlockPollingInterval,
    earliestBlock: 10523275,
  },
  {
    name: "Rinkeby",
    fullName: "Rinkeby Testnet",
    chainId: ChainId.RINKEBY,
    logoURI: ethereumLogo,
    explorerUrl: "https://rinkeby.etherscan.io",
    constructExplorerLink: defaultConstructExplorerLink(
      "https://rinkeby.etherscan.io"
    ),
    nativeCurrencySymbol: "ETH",
    pollingInterval: defaultBlockPollingInterval,
    earliestBlock: 10485193,
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
  // tokens require a mainnet address to do price lookups on coingecko, not used for anything else.
  mainnetAddress?: string;
};
// enforce weth to be first so we can use it as a guarantee in other parts of the app
export type TokenInfoList = TokenInfo[];

export const tokenList: TokenInfoList = [
  {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
    logoURI: ethereumLogo,
    mainnetAddress: getAddress("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
  },
  {
    name: "Ether",
    symbol: "OETH",
    decimals: 18,
    logoURI: "/logos/ethereum-logo.svg",
    mainnetAddress: getAddress("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
  },
  {
    name: "Ether",
    symbol: "AETH",
    decimals: 18,
    logoURI: "/logos/ethereum-logo.svg",
    mainnetAddress: getAddress("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
  },
  {
    name: "Matic",
    symbol: "WMATIC",
    decimals: 18,
    logoURI: "/logos/ethereum-logo.svg",
    mainnetAddress: getAddress("0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0"),
  },
  {
    name: "Kovan Ethereum",
    symbol: "KOV",
    decimals: 18,
    logoURI: "/logos/ethereum-logo.svg",
    mainnetAddress: getAddress("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
  },
  {
    name: "Ether",
    symbol: "KOR",
    decimals: 18,
    logoURI: "/logos/ethereum-logo.svg",
    mainnetAddress: getAddress("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
  },
  {
    name: "Ether",
    symbol: "ARETH",
    decimals: 18,
    logoURI: "/logos/ethereum-logo.svg",
    mainnetAddress: getAddress("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
  },
  {
    name: "Wrapped Ether",
    symbol: "WETH",
    decimals: 18,
    logoURI: wethLogo,
    mainnetAddress: getAddress("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
  },
  {
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    logoURI: "/logos/usdc-logo.png",
    mainnetAddress: getAddress("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"),
  },
  {
    name: "Dai Stablecoin",
    symbol: "DAI",
    decimals: 18,
    logoURI: "/logos/dai-logo.png",
    mainnetAddress: getAddress("0x6B175474E89094C44Da98b954EedeAC495271d0F"),
  },
  {
    name: "Wrapped Bitcoin",
    symbol: "WBTC",
    decimals: 8,
    logoURI: "/logos/wbtc-logo.svg",
    mainnetAddress: getAddress("0x2260fac5e5542a773aa44fbcfedf7c193bc2c599"),
  },
  {
    name: "Boba",
    symbol: "BOBA",
    decimals: 18,
    logoURI: "/logos/boba-logo.svg",
    mainnetAddress: getAddress("0x42bbfa2e77757c645eeaad1655e0911a7553efbc"),
  },
  {
    name: "UMA",
    symbol: "UMA",
    decimals: 18,
    logoURI: "/logos/uma-logo.svg",
    mainnetAddress: getAddress("0x04Fa0d235C4abf4BcF4787aF4CF447DE572eF828"),
  },
  {
    name: "Matic",
    symbol: "MATIC",
    decimals: 18,
    logoURI: "/logos/ethereum-logo.svg",
    mainnetAddress: getAddress("0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0"),
  },
  {
    name: "Balancer",
    symbol: "BAL",
    decimals: 18,
    logoURI: "/logos/bal.svg",
    mainnetAddress: getAddress("0xba100000625a3754423978a60c9317c58a424e3D"),
  },
  {
    name: "USDT",
    symbol: "USDT",
    decimals: 6,
    logoURI: "/logos/usdt-logo.svg",
    mainnetAddress: getAddress("0xdAC17F958D2ee523a2206206994597C13D831ec7"),
  },
  {
    name: "ACX",
    symbol: "ACX",
    decimals: 18,
    logoURI: "/logos/acx-logo.svg",
    mainnetAddress: getAddress("0x44108f0223A3C3028F5Fe7AEC7f9bb2E66beF82F"),
  },
];

assert(
  process.env.REACT_APP_PUBLIC_ONBOARD_API_KEY,
  "Missing process.env.REACT_APP_PUBLIC_ONBOARD_API_KEY"
);
assert(
  process.env.REACT_APP_REWARDS_API_URL,
  "Missing process.env.REACT_APP_REWARDS_API_URL"
);
assert(
  process.env.REACT_APP_CHAIN_137_PROVIDER_URL,
  "REACT_APP_CHAIN_137_PROVIDER_URL must be defined."
);
assert(
  process.env.REACT_APP_CHAIN_42161_PROVIDER_URL,
  "REACT_APP_CHAIN_42161_PROVIDER_URL must be defined."
);

// PROCESS.ENV variables
export const gasEstimationMultiplier = Number(
  process.env.REACT_APP_GAS_ESTIMATION_MULTIPLIER || 2
);
export const rewardsApiUrl = process.env.REACT_APP_REWARDS_API_URL;
export const airdropWindowIndex = Number(
  process.env.REACT_APP_AIRDROP_WINDOW_INDEX || 0
);
export const referralsStartWindowIndex = Number(
  process.env.REACT_APP_REFERRALS_START_WINDOW_INDEX || airdropWindowIndex + 1
);
export const mediumUrl = process.env.REACT_APP_MEDIUM_URL;
export const hubPoolChainId = Number(
  process.env.REACT_APP_HUBPOOL_CHAINID || 1
);
export const disableDeposits = process.env.REACT_APP_DISABLE_DEPOSITS;
export const enableReactQueryDevTools =
  process.env.REACT_APP_ENABLE_REACT_QUERY_DEV_TOOLS;
export const infuraId =
  process.env.REACT_APP_PUBLIC_INFURA_ID || "e34138b2db5b496ab5cc52319d2f0299"; // Include this constant for testing
export const confirmations =
  Number(process.env.REACT_APP_PUBLIC_CONFIRMATIONS) || 1;
export const onboardApiKey = process.env.REACT_APP_PUBLIC_ONBOARD_API_KEY;
export const matomoUrl = process.env.REACT_APP_MATOMO_URL;
export const debug = Boolean(process.env.REACT_APP_DEBUG);
export const isProductionBuild = process.env.NODE_ENV === "production";

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
export const ArbitrumProviderUrl =
  process.env.REACT_APP_CHAIN_42161_PROVIDER_URL ||
  `https://arbitrum-mainnet.infura.io/v3/${infuraId}`;

export const PolygonProviderUrl =
  process.env.REACT_APP_CHAIN_137_PROVIDER_URL ||
  `https://polygon-mainnet.infura.io/v3/${infuraId}`;

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
  const configStoreAddress = configStoreAddresses[chainId];
  assert(
    configStoreAddress !== AddressZero,
    "Config Store address not set for chain: " + chainId
  );
  return configStoreAddress;
}

export function getChainInfo(chainId: number): ChainInfo {
  assert(isSupportedChainId(chainId), "Unsupported chain id " + chainId);
  return chainInfoTable[chainId];
}

export const tokenTable = Object.fromEntries(
  tokenList.map((token) => {
    return [token.symbol, token];
  })
);

export const getToken = (symbol: string): TokenInfo => {
  const token = tokenTable[symbol];
  assert(token, "No token found for symbol: " + symbol);
  return token;
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
const RouteConfigSS = superstruct.type({
  routes: RoutesSS,
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
export function getRoutes(chainId: ChainId): RouteConfig {
  if (chainId === ChainId.KOVAN) {
    superstruct.assert(KovanRoutes, RouteConfigSS);
    return KovanRoutes;
  }
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
// a USDC approval for the _current_ spoke pools on Optimism (0xa420b2d1c0841415A695b81E5B867BCD07Dff8C9) and Arbitrum
// (0xB88690461dDbaB6f04Dfad7df66B7725942FEb9C). It also has a small amount of USDC ($0.10) used for estimations.
// If this address lacks either of these, estimations will fail and relays to optimism and arbitrum will hang when
// estimating gas. Defaults to 0x893d0d70ad97717052e3aa8903d9615804167759 so the app can technically run without this.
export const dummyFromAddress =
  process.env.REACT_APP_DUMMY_FROM_ADDRESS ||
  "0x893d0d70ad97717052e3aa8903d9615804167759";

const getRoute = (
  mainnetChainId: ChainId,
  fromChainId: number,
  symbol: string
) => {
  const routes = getRoutes(mainnetChainId);
  const route = routes.routes.find((route) => route.fromTokenSymbol === symbol);
  if (!route)
    throw new Error(
      `Couldn't find route for mainnet chain ${mainnetChainId}, fromChain: ${fromChainId}, and symbol ${symbol}`
    );
  return route;
};

const getQueriesTable = () => {
  const optimismUsdcRoute = getRoute(ChainId.MAINNET, ChainId.OPTIMISM, "USDC");
  const arbitrumUsdcRoute = getRoute(ChainId.MAINNET, ChainId.ARBITRUM, "USDC");

  return {
    [ChainId.MAINNET]: (provider: ethers.providers.Provider) =>
      new relayFeeCalculator.EthereumQueries(provider),
    [ChainId.ARBITRUM]: (provider: ethers.providers.Provider) =>
      new relayFeeCalculator.ArbitrumQueries(
        provider,
        undefined,
        arbitrumUsdcRoute.fromSpokeAddress,
        arbitrumUsdcRoute.fromTokenAddress,
        dummyFromAddress
      ),
    [ChainId.OPTIMISM]: (provider: ethers.providers.Provider) =>
      new relayFeeCalculator.OptimismQueries(
        provider,
        undefined,
        optimismUsdcRoute.fromSpokeAddress,
        optimismUsdcRoute.fromTokenAddress,
        dummyFromAddress
      ),
    [ChainId.BOBA]: (provider: ethers.providers.Provider) =>
      new relayFeeCalculator.BobaQueries(provider),
    [ChainId.POLYGON]: (provider: ethers.providers.Provider) =>
      new relayFeeCalculator.PolygonQueries(provider),
    [ChainId.KOVAN]: (provider: ethers.providers.Provider) =>
      new relayFeeCalculator.EthereumQueries(provider),
    [ChainId.RINKEBY]: (provider: ethers.providers.Provider) =>
      new relayFeeCalculator.EthereumQueries(provider),
    [ChainId.GOERLI]: (provider: ethers.providers.Provider) =>
      new relayFeeCalculator.EthereumQueries(provider),
    [ChainId.MUMBAI]: (provider: ethers.providers.Provider) =>
      new relayFeeCalculator.PolygonQueries(provider),
    // Use hardcoded DAI address instead of USDC because DAI is enabled here.
    [ChainId.KOVAN_OPTIMISM]: (provider: ethers.providers.Provider) =>
      new relayFeeCalculator.OptimismQueries(
        provider,
        undefined,
        "0x1954D4A36ac4fD8BEde42E59368565A92290E705",
        "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1"
      ),
    // Use hardcoded WETH address instead of USDC because WETH is enabled here.
    [ChainId.ARBITRUM_RINKEBY]: (provider: ethers.providers.Provider) =>
      new relayFeeCalculator.ArbitrumQueries(
        provider,
        undefined,
        "0x3BED21dAe767e4Df894B31b14aD32369cE4bad8b",
        "0xB47e6A5f8b33b3F17603C83a0535A9dcD7E32681"
      ),
  };
};

export const fixedPointAdjustment = parseEtherLike("1.0");

export const queriesTable = getQueriesTable();

export const referrerDelimiterHex = "0xd00dfeeddeadbeef";

export const usdcLpCushion = process.env.REACT_APP_USDC_LP_CUSHION || "0";
export const wethLpCushion = process.env.REACT_APP_WETH_LP_CUSHION || "0";
export const wbtcLpCushion = process.env.REACT_APP_WBTC_LP_CUSHION || "0";
export const daiLpCushion = process.env.REACT_APP_DAI_LP_CUSHION || "0";
export const balLpCushion = process.env.REACT_APP_BAL_LP_CUSHION || "0";
export const umaLpCushion = process.env.REACT_APP_UMA_LP_CUSHION || "0";
export const bobaLpCushion = process.env.REACT_APP_BOBA_LP_CUSHION || "0";

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
  xs: 400,
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
    title: "Bronzer tier",
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

export const secondsPerYear = across.constants.SECONDS_PER_YEAR;
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

export const amplitudeEnvironment =
  process.env.REACT_APP_AMPLITUDE_ENVIRONMENT === "production"
    ? "production"
    : "development";

export const currentGitCommitHash = process.env.REACT_APP_GIT_COMMIT_HASH ?? "";
