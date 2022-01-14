import { ethers } from "ethers";
import { Initialization } from "bnc-onboard/dist/src/interfaces";
import ethereumLogo from "assets/ethereum-logo.svg";
import usdcLogo from "assets/usdc-logo.png";
import optimismLogo from "assets/optimism-alt-logo.svg";
import wethLogo from "assets/weth-logo.svg";
import arbitrumLogo from "assets/arbitrum-logo.svg";
import memoize from "lodash-es/memoize";
import umaLogo from "assets/UMA-round.svg";
import bobaLogo from "assets/Across-Boba-Color30x30.svg";
import badgerLogo from "assets/badger-logo.png";
import wbtcLogo from "assets/wbtc-logo.svg";
import { getAddress } from "./address";
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
    200: "220deg 2% 72%",
    300: "240deg 4% 27%",
    500: "230deg 6% 19%",
  },
  primary: {
    500: "166deg 92% 70%",
    700: "180deg 15% 25%",
  },
  secondary: {
    500: "266deg 77% 62%",
  },
  error: {
    500: "11deg 92% 70%",
    300: "11deg 93% 94%",
  },
  white: "0deg 100% 100%",
  black: "0deg 0% 0%",
  umaRed: "0deg 100% 65%",
};

/* Chains and Tokens section */

export enum ChainId {
  MAINNET = 1,
  RINKEBY = 4,
  KOVAN = 42,
  OPTIMISM = 10,
  KOVAN_OPTIMISM = 69,
  ARBITRUM = 42161,
  ARBITRUM_RINKEBY = 421611,
  BOBA = 288,
}

export type Token = {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  bridgePool: string;
};
// enforce weth to be first so we can use it as a guarantee in other parts of the app
type TokenList = [
  {
    address: string;
    symbol: "WETH";
    name: "Wrapped Ether";
    decimals: 18;
    logoURI: typeof wethLogo;
    bridgePool: string;
  },
  ...Token[]
];
export const TOKENS_LIST: Record<ChainId, TokenList> = {
  [ChainId.MAINNET]: [
    {
      address: getAddress("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
      name: "Wrapped Ether",
      symbol: "WETH",
      decimals: 18,
      logoURI: wethLogo,
      bridgePool: getAddress("0x7355Efc63Ae731f584380a9838292c7046c1e433"),
    },
    {
      address: getAddress("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"),
      name: "USD Coin",
      symbol: "USDC",
      decimals: 6,
      logoURI: usdcLogo,
      bridgePool: getAddress("0x256C8919CE1AB0e33974CF6AA9c71561Ef3017b6"),
    },
    {
      address: ethers.constants.AddressZero,
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
      logoURI: ethereumLogo,
      bridgePool: getAddress("0x7355Efc63Ae731f584380a9838292c7046c1e433"),
    },
    {
      address: getAddress("0x2260fac5e5542a773aa44fbcfedf7c193bc2c599"),
      name: "Wrapped Bitcoin",
      symbol: "WBTC",
      decimals: 8,
      logoURI: wbtcLogo,
      bridgePool: getAddress("0x02fbb64517e1c6ed69a6faa3abf37db0482f1152")
    },
    {
      address: getAddress("0x04Fa0d235C4abf4BcF4787aF4CF447DE572eF828"),
      name: "UMA Token",
      symbol: "UMA",
      decimals: 18,
      logoURI: umaLogo,
      bridgePool: "0xdfe0ec39291e3b60ACa122908f86809c9eE64E90",
    },
    {
      address: getAddress("0x3472A5A71965499acd81997a54BBA8D852C6E53d"),
      name: "Badger",
      symbol: "BADGER",
      decimals: 18,
      logoURI: badgerLogo,
      bridgePool: getAddress("0x43298F9f91a4545dF64748e78a2c777c580573d6"),
    },
  ],
  [ChainId.RINKEBY]: [
    {
      address: getAddress("0xc778417E063141139Fce010982780140Aa0cD5Ab"),
      name: "Wrapped Ether",
      symbol: "WETH",
      decimals: 18,
      logoURI: wethLogo,
      bridgePool: getAddress("0xf42bB7EC88d065dF48D60cb672B88F8330f9f764"),
    },
    {
      address: ethers.constants.AddressZero,
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
      logoURI: ethereumLogo,
      bridgePool: "",
    },
  ],
  [ChainId.KOVAN]: [
    {
      address: getAddress("0xd0a1e359811322d97991e03f863a0c30c2cf029c"),
      name: "Wrapped Ether",
      symbol: "WETH",
      decimals: 18,
      logoURI: wethLogo,
      bridgePool: "i",
    },
    {
      address: getAddress("0x08ae34860fbfe73e223596e65663683973c72dd3"),
      name: "DAI Stablecoin",
      symbol: "DAI",
      decimals: 18,
      logoURI: usdcLogo,
      bridgePool: "f",
    },
    {
      address: ethers.constants.AddressZero,
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
      logoURI: ethereumLogo,
      bridgePool: "d",
    },
  ],
  [ChainId.OPTIMISM]: [
    {
      address: getAddress("0x4200000000000000000000000000000000000006"),
      name: "Wrapped Ether",
      symbol: "WETH",
      decimals: 18,
      logoURI: wethLogo,
      bridgePool: getAddress("0x7355Efc63Ae731f584380a9838292c7046c1e433"),
    },
    {
      address: getAddress("0x7f5c764cbc14f9669b88837ca1490cca17c31607"),
      name: "USD Coin",
      symbol: "USDC",
      decimals: 6,
      logoURI: usdcLogo,
      bridgePool: getAddress("0x190978cC580f5A48D55A4A20D0A952FA1dA3C057"),
    },
    {
      address: getAddress("0x68f180fcCe6836688e9084f035309E29Bf0A2095"),
      name: "Wrapped Bitcoin",
      symbol: "WBTC",
      decimals: 8,
      logoURI: wbtcLogo,
      bridgePool: getAddress("0x02fbb64517e1c6ed69a6faa3abf37db0482f1152")
    },
    {
      address: getAddress("0xE7798f023fC62146e8Aa1b36Da45fb70855a77Ea"),
      name: "UMA Token",
      symbol: "UMA",
      decimals: 18,
      logoURI: umaLogo,
      bridgePool: getAddress("0xdfe0ec39291e3b60ACa122908f86809c9eE64E90"),
    },
    {
      address: ethers.constants.AddressZero,
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
      logoURI: ethereumLogo,
      bridgePool: getAddress("0x7355Efc63Ae731f584380a9838292c7046c1e433"),
    },
  ],
  [ChainId.KOVAN_OPTIMISM]: [
    {
      address: getAddress("0x4200000000000000000000000000000000000006"),
      name: "Wrapped Ether",
      symbol: "WETH",
      decimals: 18,
      logoURI: wethLogo,
      bridgePool: "m",
    },
    {
      address: getAddress("0x2a41F55E25EfEE3E53834140c0bD81dBF3464831"),
      name: "DAI (L2 Dai)",
      symbol: "DAI",
      decimals: 18,
      logoURI: usdcLogo,
      bridgePool: "",
    },
    {
      address: ethers.constants.AddressZero,
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
      logoURI: ethereumLogo,
      bridgePool: "",
    },
  ],
  [ChainId.ARBITRUM]: [
    {
      address: getAddress("0x82af49447d8a07e3bd95bd0d56f35241523fbab1"),
      name: "Wrapped Ether",
      symbol: "WETH",
      decimals: 18,
      logoURI: wethLogo,
      bridgePool: getAddress("0x7355Efc63Ae731f584380a9838292c7046c1e433"),
    },
    {
      address: getAddress("0xff970a61a04b1ca14834a43f5de4533ebddb5cc8"),
      name: "USD Coin",
      symbol: "USDC",
      decimals: 6,
      logoURI: usdcLogo,
      bridgePool: getAddress("0x256C8919CE1AB0e33974CF6AA9c71561Ef3017b6"),
    },
    {
      address: getAddress("0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f"),
      name: "Wrapped Bitcoin",
      symbol: "WBTC",
      decimals: 8,
      logoURI: wbtcLogo,
      bridgePool: getAddress("0x02fbb64517e1c6ed69a6faa3abf37db0482f1152")
    },
    {
      address: getAddress("0xd693ec944a85eeca4247ec1c3b130dca9b0c3b22"),
      name: "UMA Token",
      symbol: "UMA",
      decimals: 18,
      logoURI: umaLogo,
      bridgePool: getAddress("0xdfe0ec39291e3b60ACa122908f86809c9eE64E90"),
    },
    {
      address: ethers.constants.AddressZero,
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
      logoURI: ethereumLogo,
      bridgePool: getAddress("0x7355Efc63Ae731f584380a9838292c7046c1e433"),
    },
    {
      address: getAddress("0xbfa641051ba0a0ad1b0acf549a89536a0d76472e"),
      name: "Badger",
      symbol: "BADGER",
      decimals: 18,
      logoURI: badgerLogo,
      bridgePool: getAddress("0x43298F9f91a4545dF64748e78a2c777c580573d6"),
    },
  ],
  [ChainId.ARBITRUM_RINKEBY]: [
    {
      address: getAddress("0xB47e6A5f8b33b3F17603C83a0535A9dcD7E32681"),
      name: "Wrapped Ether",
      symbol: "WETH",
      decimals: 18,
      logoURI: wethLogo,
      bridgePool: "",
    },
    {
      address: ethers.constants.AddressZero,
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
      logoURI: ethereumLogo,
      bridgePool: "",
    },
  ],
  [ChainId.BOBA]: [
    {
      address: getAddress("0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000"),
      name: "Wrapped Ether",
      symbol: "WETH",
      decimals: 18,
      logoURI: wethLogo,
      bridgePool: getAddress("0x7355Efc63Ae731f584380a9838292c7046c1e433"),
    },
    {
      address: getAddress("0x66a2A913e447d6b4BF33EFbec43aAeF87890FBbc"),
      name: "USD Coin",
      symbol: "USDC",
      decimals: 6,
      logoURI: usdcLogo,
      bridgePool: getAddress("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"),
    },
    {
      address: getAddress("0xdc0486f8bf31DF57a952bcd3c1d3e166e3d9eC8b"),
      name: "Wrapped Bitcoin",
      symbol: "WBTC",
      decimals: 8,
      logoURI: wbtcLogo,
      bridgePool: getAddress("0x02fbb64517e1c6ed69a6faa3abf37db0482f1152")
    },
    {
      address: getAddress("0x780f33Ad21314d9A1Ffb6867Fe53d48a76Ec0D16"),
      name: "UMA Token",
      symbol: "UMA",
      decimals: 18,
      logoURI: umaLogo,
      bridgePool: getAddress("0xdfe0ec39291e3b60ACa122908f86809c9eE64E90"),
    },
    {
      address: ethers.constants.AddressZero,
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
      logoURI: ethereumLogo,
      bridgePool: "",
    },
  ],
};

type ChainInfo = {
  name: string;
  chainId: ChainId;
  logoURI: string;
  rpcUrl?: string;
  explorerUrl: string;
  constructExplorerLink: (txHash: string) => string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
};

const defaultConstructExplorerLink =
  (explorerUrl: string) => (txHash: string) =>
    `${explorerUrl}/tx/${txHash}`;
export const CHAINS: Record<ChainId, ChainInfo> = {
  [ChainId.MAINNET]: {
    name: "Ethereum Mainnet",
    chainId: ChainId.MAINNET,
    logoURI: ethereumLogo,
    explorerUrl: "https://etherscan.io",
    constructExplorerLink: defaultConstructExplorerLink("https://etherscan.io"),
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  [ChainId.RINKEBY]: {
    name: "Rinkeby Testnet",
    chainId: ChainId.RINKEBY,
    logoURI: ethereumLogo,
    explorerUrl: "https://rinkeby.etherscan.io",
    constructExplorerLink: defaultConstructExplorerLink(
      "https://rinkeby.etherscan.io"
    ),
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  [ChainId.KOVAN]: {
    name: "Ethereum Testnet Kovan",
    chainId: ChainId.KOVAN,
    logoURI: ethereumLogo,
    explorerUrl: "https://kovan.etherscan.io",
    constructExplorerLink: defaultConstructExplorerLink(
      "https://kovan.etherscan.io"
    ),
    nativeCurrency: {
      name: "Kovan Ethereum",
      symbol: "KOV",
      decimals: 18,
    },
  },
  [ChainId.OPTIMISM]: {
    name: "Optimism",
    chainId: ChainId.OPTIMISM,
    logoURI: optimismLogo,
    rpcUrl: "https://mainnet.optimism.io",
    explorerUrl: "https://optimistic.etherscan.io",
    constructExplorerLink: (txHash: string) =>
      `https://optimistic.etherscan.io/tx/${txHash}`,
    nativeCurrency: {
      name: "Ether",
      symbol: "OETH",
      decimals: 18,
    },
  },
  [ChainId.KOVAN_OPTIMISM]: {
    name: "Optimism Testnet Kovan",
    chainId: ChainId.KOVAN_OPTIMISM,
    logoURI: optimismLogo,
    rpcUrl: "https://kovan.optimism.io",
    explorerUrl: "https://kovan-optimistic.etherscan.io",
    constructExplorerLink: (txHash: string) =>
      `https://kovan-optimistic.etherscan.io/tx/${txHash}`,
    nativeCurrency: {
      name: "Ether",
      symbol: "KOR",
      decimals: 18,
    },
  },
  [ChainId.ARBITRUM]: {
    name: "Arbitrum One",
    chainId: ChainId.ARBITRUM,
    logoURI: arbitrumLogo,
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    explorerUrl: "https://arbiscan.io",
    constructExplorerLink: (txHash: string) =>
      `https://arbiscan.io/tx/${txHash}`,
    nativeCurrency: {
      name: "Ether",
      symbol: "AETH",
      decimals: 18,
    },
  },
  [ChainId.ARBITRUM_RINKEBY]: {
    name: "Arbitrum Testnet Rinkeby",
    chainId: ChainId.ARBITRUM_RINKEBY,
    logoURI: arbitrumLogo,
    explorerUrl: "https://rinkeby-explorer.arbitrum.io",
    constructExplorerLink: (txHash: string) =>
      `https://rinkeby-explorer.arbitrum.io/tx/${txHash}`,
    rpcUrl: "https://rinkeby.arbitrum.io/rpc",
    nativeCurrency: {
      name: "Ether",
      symbol: "ARETH",
      decimals: 18,
    },
  },
  [ChainId.BOBA]: {
    name: "Boba",
    chainId: ChainId.BOBA,
    logoURI: bobaLogo,
    rpcUrl: "https://mainnet.boba.network",
    explorerUrl: "https://blockexplorer.boba.network",
    constructExplorerLink: (txHash: string) =>
      `https://blockexplorer.boba.network/tx/${txHash}`,
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
};

export const ADDRESSES: Record<ChainId, { BRIDGE?: string }> = {
  [ChainId.MAINNET]: {
    // Stubbed value. Does not work. TODO: Change this out when contract deployed.
    BRIDGE: "0x2271a5E74eA8A29764ab10523575b41AA52455f0",
  },
  [ChainId.RINKEBY]: {},
  [ChainId.KOVAN]: {},
  [ChainId.OPTIMISM]: {
    BRIDGE: "0x3baD7AD0728f9917d1Bf08af5782dCbD516cDd96",
  },
  [ChainId.BOBA]: {
    BRIDGE: "0xCD43CEa89DF8fE39031C03c24BC24480e942470B",
  },
  [ChainId.KOVAN_OPTIMISM]: {
    BRIDGE: "0x2271a5E74eA8A29764ab10523575b41AA52455f0",
  },
  [ChainId.ARBITRUM]: {
    BRIDGE: "0xD8c6dD978a3768F7DDfE3A9aAD2c3Fd75Fa9B6Fd",
  },
  [ChainId.ARBITRUM_RINKEBY]: {
    BRIDGE: "0x6999526e507Cc3b03b180BbE05E1Ff938259A874",
  },
};

type GetProvider = () => ethers.providers.JsonRpcProvider;
export const PROVIDERS: Record<ChainId, GetProvider> = {
  [ChainId.MAINNET]: memoize(
    () =>
      new ethers.providers.StaticJsonRpcProvider(
        `https://mainnet.infura.io/v3/${process.env.REACT_APP_PUBLIC_INFURA_ID}`
      )
  ),
  [ChainId.RINKEBY]: memoize(
    () =>
      new ethers.providers.StaticJsonRpcProvider(
        `https://rinkeby.infura.io/v3/${process.env.REACT_APP_PUBLIC_INFURA_ID}`
      )
  ),
  [ChainId.KOVAN]: memoize(
    () =>
      new ethers.providers.StaticJsonRpcProvider(
        `https://kovan.infura.io/v3/${process.env.REACT_APP_PUBLIC_INFURA_ID}`
      )
  ),
  [ChainId.OPTIMISM]: memoize(
    () =>
      new ethers.providers.StaticJsonRpcProvider(
        `https://optimism-mainnet.infura.io/v3/${process.env.REACT_APP_PUBLIC_INFURA_ID}`
      )
  ),
  [ChainId.KOVAN_OPTIMISM]: memoize(
    () =>
      new ethers.providers.StaticJsonRpcProvider(
        `https://optimism-kovan.infura.io/v3/${process.env.REACT_APP_PUBLIC_INFURA_ID}`
      )
  ),
  [ChainId.ARBITRUM]: memoize(
    () =>
      new ethers.providers.StaticJsonRpcProvider(
        `https://arbitrum-mainnet.infura.io/v3/${process.env.REACT_APP_PUBLIC_INFURA_ID}`
      )
  ),
  [ChainId.ARBITRUM_RINKEBY]: memoize(
    () =>
      new ethers.providers.StaticJsonRpcProvider(
        `https://arbitrum-rinkeby.infura.io/v3/${process.env.REACT_APP_PUBLIC_INFURA_ID}`
      )
  ),
  // Doesn't have an rpc on infura.
  [ChainId.BOBA]: memoize(
    () =>
      new ethers.providers.StaticJsonRpcProvider(`https://mainnet.boba.network`)
  ),
};

export function getChainName(chainId: ChainId): string {
  switch (chainId) {
    case ChainId.MAINNET:
      return CHAINS[ChainId.MAINNET].name;
    case ChainId.RINKEBY:
      return CHAINS[ChainId.RINKEBY].name;
    case ChainId.KOVAN:
      return CHAINS[ChainId.KOVAN].name;
    case ChainId.OPTIMISM:
      return CHAINS[ChainId.OPTIMISM].name;
    case ChainId.KOVAN_OPTIMISM:
      return CHAINS[ChainId.KOVAN_OPTIMISM].name;
    case ChainId.ARBITRUM:
      return CHAINS[ChainId.ARBITRUM].name;
    case ChainId.ARBITRUM_RINKEBY:
      return CHAINS[ChainId.ARBITRUM_RINKEBY].name;
    default:
      return "unkwown";
  }
}

export const DEFAULT_FROM_CHAIN_ID = ChainId.ARBITRUM;
export const DEFAULT_TO_CHAIN_ID = ChainId.MAINNET;

/* Onboard config */

export function onboardBaseConfig(): Initialization {
  // const infuraRpc = PROVIDERS[DEFAULT_FROM_CHAIN_ID]().connection.url;
  return {
    dappId: process.env.REACT_APP_PUBLIC_ONBOARD_API_KEY || "",
    networkId: DEFAULT_FROM_CHAIN_ID,
    hideBranding: true,
    walletSelect: {
      wallets: [{ walletName: "metamask", preferred: true }],
    },
    walletCheck: [{ checkName: "connect" }, { checkName: "accounts" }],
    // To prevent providers from requesting block numbers every 4 seconds (see https://github.com/WalletConnect/walletconnect-monorepo/issues/357)
    blockPollingInterval: 1000 * 60 * 60,
  };
}

// this client requires multicall2 be accessible on the chain. This is the address for mainnet.
export const multicallTwoAddress = "0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696";
export interface IChainSelection {
  name: string;
  chainId: ChainId;
  logoURI: string;
  rpcUrl: string;
  explorerUrl: string;
  constructExplorerLink: (txHash: string) => string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

interface EthChainInfo {
  name: "Ethereum";
  chainId: 1;
  logoURI: string;
  rpcUrl: string;
  explorerUrl: string;
  constructExplorerLink: (txHash: string) => string;
  nativeCurrency: {
    name: "Ether";
    symbol: "ETH";
    decimals: 18;
  };
}

type ChainsSelection = [...IChainSelection[], EthChainInfo];
export const CHAINS_SELECTION: ChainsSelection = [
  {
    name: "Optimism",
    chainId: ChainId.OPTIMISM,
    logoURI: optimismLogo,
    rpcUrl: "https://mainnet.optimism.io",
    explorerUrl: "https://optimistic.etherscan.io",
    constructExplorerLink: defaultConstructExplorerLink(
      "https://optimistic.etherscan.io"
    ),
    nativeCurrency: {
      name: "Ether",
      symbol: "OETH",
      decimals: 18,
    },
  },
  {
    name: "Arbitrum",
    chainId: ChainId.ARBITRUM,
    logoURI: arbitrumLogo,
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    explorerUrl: "https://arbiscan.io",
    constructExplorerLink: (txHash: string) =>
      `https://arbiscan.io/tx/${txHash}`,
    nativeCurrency: {
      name: "Ether",
      symbol: "AETH",
      decimals: 18,
    },
  },
  {
    name: "Boba",
    chainId: ChainId.BOBA,
    logoURI: bobaLogo,
    rpcUrl: "https://mainnet.boba.network",
    explorerUrl: "https://blockexplorer.boba.network",
    constructExplorerLink: (txHash: string) =>
      `https://blockexplorer.boba.network/tx/${txHash}`,
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  {
    name: "Ethereum",
    chainId: ChainId.MAINNET,
    logoURI: ethereumLogo,
    // Doesn't have an RPC on Infura. Need to know how to handle this
    rpcUrl: "https://mainnet.infura.io/v3/",
    explorerUrl: "https://etherscan.io",
    constructExplorerLink: (txHash: string) =>
      `https://etherscan.io/tx/${txHash}`,
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
];

export const MAX_APPROVAL_AMOUNT = ethers.constants.MaxUint256;
