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

// all routes should be pre imported to be able to switch based on chain id
import KovanRoutes from "data/routes_42_0xD449Af45a032Df413b497A709EeD3E8C112EbcE3.json";
import MainnetRoutes from "data/routes_1_0x6Bb9910c5529Cb3b32c4f0e13E8bC38F903b2534.json";

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

export const MAX_RELAY_FEE_PERCENT = 25;

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
export const RATEMODEL_ADDRESSES: Record<ChainId, string> = {
  [ChainId.MAINNET]: getAddress("0xd18fFeb5fdd1F2e122251eA7Bf357D8Af0B60B50"),
  [ChainId.ARBITRUM]: ethers.constants.AddressZero,
  [ChainId.OPTIMISM]: ethers.constants.AddressZero,
  [ChainId.BOBA]: ethers.constants.AddressZero,
  [ChainId.POLYGON]: ethers.constants.AddressZero,
  [ChainId.RINKEBY]: ethers.constants.AddressZero,
  [ChainId.KOVAN]: getAddress("0x5923929DF7A2D6E038bb005B167c1E8a86cd13C8"),
  [ChainId.KOVAN_OPTIMISM]: ethers.constants.AddressZero,
  [ChainId.ARBITRUM_RINKEBY]: ethers.constants.AddressZero,
  [ChainId.GOERLI]: ethers.constants.AddressZero,
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
};

export type ChainInfoList = ChainInfo[];
export type ChainInfoTable = Record<number, ChainInfo>;
export const defaultBlockPollingInterval = Number(
  process.env.REACT_APP_DEFAULT_BLOCK_POLLING_INTERVAL || 30 * 1000
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
    name: "Boba",
    chainId: ChainId.BOBA,
    logoURI: bobaLogo,
    rpcUrl: "https://mainnet.boba.network",
    explorerUrl: "https://blockexplorer.boba.network",
    constructExplorerLink: (txHash: string) =>
      `https://blockexplorer.boba.network/tx/${txHash}`,
    nativeCurrencySymbol: "ETH",
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
    nativeCurrencySymbol: "MATIC",
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
    name: "Badger",
    symbol: "BADGER",
    decimals: 18,
    logoURI: "/logos/badger-logo.svg",
    mainnetAddress: getAddress("0x3472A5A71965499acd81997a54BBA8D852C6E53d"),
  },
  {
    name: "UMA",
    symbol: "UMA",
    decimals: 18,
    logoURI: "/logos/uma-logo.svg",
    mainnetAddress: getAddress("0x04Fa0d235C4abf4BcF4787aF4CF447DE572eF828"),
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
    symbol: "MATIC",
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
];

export const lowerBounds = {
  [ChainId.ARBITRUM_RINKEBY]: 10523275,
  [ChainId.KOVAN_OPTIMISM]: 1618630,
  [ChainId.KOVAN]: 30475937,
  [ChainId.MAINNET]: 0,
  [ChainId.ARBITRUM]: 0,
  [ChainId.OPTIMISM]: 0,
  [ChainId.BOBA]: 0,
  [ChainId.POLYGON]: 0,
  [ChainId.RINKEBY]: 0,
  [ChainId.GOERLI]: 0,
  [ChainId.MUMBAI]: 0,
};

assert(
  process.env.REACT_APP_HUBPOOL_CHAINID,
  "Missing process.env.REACT_APP_HUBPOOL_CHAINID"
);
assert(
  process.env.REACT_APP_PUBLIC_INFURA_ID,
  "Missing process.env.REACT_APP_PUBLIC_INFURA_ID"
);
assert(
  process.env.REACT_APP_PUBLIC_ONBOARD_API_KEY,
  "Missing process.env.REACT_APP_PUBLIC_ONBOARD_API_KEY"
);

export const hubPoolChainId = Number(process.env.REACT_APP_HUBPOOL_CHAINID);
export const disableDeposits = process.env.REACT_APP_DISABLE_DEPOSITS;
export const enableReactQueryDevTools =
  process.env.REACT_APP_ENABLE_REACT_QUERY_DEV_TOOLS;
export const infuraId = process.env.REACT_APP_PUBLIC_INFURA_ID;
export const confirmations =
  Number(process.env.REACT_APP_PUBLIC_CONFIRMATIONS) || 1;
export const onboardApiKey = process.env.REACT_APP_PUBLIC_ONBOARD_API_KEY;

export const MAX_APPROVAL_AMOUNT = ethers.constants.MaxUint256;
export const FEE_ESTIMATION = ".004";
export const AddressZero = ethers.constants.AddressZero;

assert(
  isSupportedChainId(hubPoolChainId),
  "Hubpool chain is not supported: " + hubPoolChainId
);
export function isSupportedChainId(chainId: number): chainId is ChainId {
  return chainId in ChainId;
}
export const providerUrls: [ChainId, string][] = [
  [ChainId.MAINNET, `https://mainnet.infura.io/v3/${infuraId}`],
  [ChainId.OPTIMISM, `https://optimism-mainnet.infura.io/v3/${infuraId}`],
  [ChainId.ARBITRUM, `https://arbitrum-mainnet.infura.io/v3/${infuraId}`],
  [ChainId.BOBA, `https://mainnet.boba.network`],
  [ChainId.POLYGON, `https://polygon-mainnet.infura.io/v3/${infuraId}`],
  [ChainId.RINKEBY, `https://rinkeby.infura.io/v3/${infuraId}`],
  [ChainId.KOVAN, `https://kovan.infura.io/v3/${infuraId}`],
  [ChainId.KOVAN_OPTIMISM, `https://optimism-kovan.infura.io/v3/${infuraId}`],
  [
    ChainId.ARBITRUM_RINKEBY,
    `https://arbitrum-rinkeby.infura.io/v3/${infuraId}`,
  ],
  [ChainId.GOERLI, `https://goerli.infura.io/v3/${infuraId}`],
  [ChainId.MUMBAI, `https://polygon-mumbai.infura.io/v3/${infuraId}`],
];
export const providerUrlsTable: Record<number, string> =
  Object.fromEntries(providerUrls);

export const providers: [number, ethers.providers.StaticJsonRpcProvider][] =
  providerUrls.map(([chainId, url]) => {
    return [chainId, new ethers.providers.StaticJsonRpcProvider(url)];
  });
export const providersTable: Record<
  number,
  ethers.providers.StaticJsonRpcProvider
> = Object.fromEntries(providers);

export function getProvider(
  chainId: ChainId = hubPoolChainId
): ethers.providers.StaticJsonRpcProvider {
  return providersTable[chainId];
}

export function getRateModelAddress(chainId: ChainId = hubPoolChainId): string {
  const rateModelAddress = RATEMODEL_ADDRESSES[chainId];
  assert(
    rateModelAddress !== AddressZero,
    "Rate model address not set for chain: " + chainId
  );
  return rateModelAddress;
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

const Route = superstruct.object({
  fromChain: superstruct.number(),
  toChain: superstruct.number(),
  fromTokenAddress: superstruct.string(),
  fromSpokeAddress: superstruct.string(),
  fromTokenSymbol: superstruct.string(),
  isNative: superstruct.boolean(),
  l1TokenAddress: superstruct.string(),
});
const Routes = superstruct.array(Route);
const RouteConfig = superstruct.type({
  routes: Routes,
  hubPoolWethAddress: superstruct.string(),
  hubPoolChain: superstruct.number(),
  hubPoolAddress: superstruct.string(),
});
export type RouteConfig = superstruct.Infer<typeof RouteConfig>;
export type Route = superstruct.Infer<typeof Route>;
export type Routes = superstruct.Infer<typeof Routes>;
export function getRoutes(chainId: ChainId): RouteConfig {
  if (chainId === ChainId.KOVAN) {
    superstruct.assert(KovanRoutes, RouteConfig);
    return KovanRoutes;
  }
  if (chainId === ChainId.MAINNET) {
    superstruct.assert(MainnetRoutes, RouteConfig);
    return MainnetRoutes;
  }
  throw new Error("No routes defined for chainId: " + chainId);
}

export const routeConfig = getRoutes(hubPoolChainId);
export const hubPoolAddress = routeConfig.hubPoolAddress;
