import { ethers } from "ethers";
import { Initialization } from "bnc-onboard/dist/src/interfaces";
import ethereumLogo from "assets/ethereum-logo.png";
import usdcLogo from "assets/usdc-logo.png";
import optimismLogo from "assets/optimism.svg";
import wethLogo from "assets/weth-logo.svg";
import arbitrumLogo from "assets/arbitrum-logo.svg";
import memoize from "lodash.memoize";
import umaLogo from "assets/UMA-round.svg";

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
};

export const COLORS = {
  gray: {
    100: "0deg 0% 89%",
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
    name: "Wrapped Ethereum";
    decimals: 18;
    logoURI: typeof wethLogo;
    bridgePool: string;
  },
  ...Token[]
];
export const TOKENS_LIST: Record<ChainId, TokenList> = {
  [ChainId.MAINNET]: [
    {
      address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      name: "Wrapped Ethereum",
      symbol: "WETH",
      decimals: 18,
      logoURI: wethLogo,
      bridgePool: "0xf42bB7EC88d065dF48D60cb672B88F8330f9f764",
    },
    {
      address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      name: "USD Coin",
      symbol: "USDC",
      decimals: 6,
      logoURI: usdcLogo,
      bridgePool: "0x190978cC580f5A48D55A4A20D0A952FA1dA3C057",
    },
    {
      address: ethers.constants.AddressZero,
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
      logoURI: ethereumLogo,
      bridgePool: "0xf42bB7EC88d065dF48D60cb672B88F8330f9f764",
    },
  ],
  [ChainId.RINKEBY]: [
    {
      address: "0xc778417E063141139Fce010982780140Aa0cD5Ab",
      name: "Wrapped Ethereum",
      symbol: "WETH",
      decimals: 18,
      logoURI: wethLogo,
      bridgePool: "0xf42bB7EC88d065dF48D60cb672B88F8330f9f764",
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
      address: "0xd0a1e359811322d97991e03f863a0c30c2cf029c",
      name: "Wrapped Ethereum",
      symbol: "WETH",
      decimals: 18,
      logoURI: wethLogo,
      bridgePool: "i",
    },
    {
      address: "0x08ae34860fbfe73e223596e65663683973c72dd3",
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
      address: "0x4200000000000000000000000000000000000006",
      name: "Wrapped Ethereum",
      symbol: "WETH",
      decimals: 18,
      logoURI: wethLogo,
      bridgePool: "0xf42bB7EC88d065dF48D60cb672B88F8330f9f764",
    },
    {
      address: "0x7f5c764cbc14f9669b88837ca1490cca17c31607",
      name: "USD Coin",
      symbol: "USDC",
      decimals: 6,
      logoURI: usdcLogo,
      bridgePool: "0x190978cC580f5A48D55A4A20D0A952FA1dA3C057",
    },
    {
      address: ethers.constants.AddressZero,
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
      logoURI: ethereumLogo,
      bridgePool: "0xf42bB7EC88d065dF48D60cb672B88F8330f9f764",
    },
  ],
  [ChainId.KOVAN_OPTIMISM]: [
    {
      address: "0x4200000000000000000000000000000000000006",
      name: "Wrapped Ethereum",
      symbol: "WETH",
      decimals: 18,
      logoURI: wethLogo,
      bridgePool: "m",
    },
    {
      address: "0x2a41F55E25EfEE3E53834140c0bD81dBF3464831",
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
      address: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
      name: "Wrapped Ethereum",
      symbol: "WETH",
      decimals: 18,
      logoURI: wethLogo,
      bridgePool: "0x75a29a66452C80702952bbcEDd284C8c4CF5Ab17",
    },
    {
      address: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
      name: "USD Coin",
      symbol: "USDC",
      decimals: 6,
      logoURI: usdcLogo,
      bridgePool: "0x54d8d0a00b8288b49694a765C59694ddE8e4B931",
    },
    {
      address: ethers.constants.AddressZero,
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
      logoURI: ethereumLogo,
      bridgePool: "0x75a29a66452C80702952bbcEDd284C8c4CF5Ab17",
    },
  ],
  [ChainId.ARBITRUM_RINKEBY]: [
    {
      address: "0xB47e6A5f8b33b3F17603C83a0535A9dcD7E32681",
      name: "Wrapped Ethereum",
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
    explorerUrl: "https://etherscan.io/",
    constructExplorerLink: defaultConstructExplorerLink(
      "https://etherscan.io/"
    ),
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
    name: "Optimistic Ethereum",
    chainId: ChainId.OPTIMISM,
    logoURI: optimismLogo,
    rpcUrl: "https://mainnet.optimism.io",
    explorerUrl: "https://optimistic.etherscan.io/",
    constructExplorerLink: defaultConstructExplorerLink(
      "https://optimistic.etherscan.io/"
    ),
    nativeCurrency: {
      name: "Ether",
      symbol: "OETH",
      decimals: 18,
    },
  },
  [ChainId.KOVAN_OPTIMISM]: {
    name: "Optimistic Ethereum Testnet Kovan",
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
};

export const ADDRESSES: Record<ChainId, { BRIDGE?: string }> = {
  [ChainId.MAINNET]: {},
  [ChainId.RINKEBY]: {},
  [ChainId.KOVAN]: {},
  [ChainId.OPTIMISM]: {},
  [ChainId.KOVAN_OPTIMISM]: {
    BRIDGE: "0x2271a5E74eA8A29764ab10523575b41AA52455f0",
  },
  [ChainId.ARBITRUM]: {
    BRIDGE: "0xeF684C38F94F48775959ECf2012D7E864ffb9dd4",
  },
  [ChainId.ARBITRUM_RINKEBY]: {
    BRIDGE: "0x6999526e507Cc3b03b180BbE05E1Ff938259A874",
  },
};

type GetProvider = () => ethers.providers.JsonRpcProvider;
export const PROVIDERS: Record<ChainId, GetProvider> = {
  [ChainId.MAINNET]: memoize(
    () =>
      new ethers.providers.JsonRpcProvider(
        `https://mainnet.infura.io/v3/${process.env.REACT_APP_PUBLIC_INFURA_ID}`
      )
  ),
  [ChainId.RINKEBY]: memoize(
    () =>
      new ethers.providers.JsonRpcProvider(
        `https://rinkeby.infura.io/v3/${process.env.REACT_APP_PUBLIC_INFURA_ID}`
      )
  ),
  [ChainId.KOVAN]: memoize(
    () =>
      new ethers.providers.JsonRpcProvider(
        `https://kovan.infura.io/v3/${process.env.REACT_APP_PUBLIC_INFURA_ID}`
      )
  ),
  [ChainId.OPTIMISM]: memoize(
    () =>
      new ethers.providers.JsonRpcProvider(
        `https://optimism-mainnet.infura.io/v3/${process.env.REACT_APP_PUBLIC_INFURA_ID}`
      )
  ),
  [ChainId.KOVAN_OPTIMISM]: memoize(
    () =>
      new ethers.providers.JsonRpcProvider(
        `https://optimism-kovan.infura.io/v3/${process.env.REACT_APP_PUBLIC_INFURA_ID}`
      )
  ),
  [ChainId.ARBITRUM]: memoize(
    () =>
      new ethers.providers.JsonRpcProvider(
        "https://arb-mainnet.g.alchemy.com/v2/1SJeu8UAnhkQNR23ixdtkOjnJy6LbF4G"
      )
    // new ethers.providers.JsonRpcProvider(
    //   `https://arbitrum-mainnet.infura.io/v3/${process.env.REACT_APP_PUBLIC_INFURA_ID}`
    // )
  ),
  [ChainId.ARBITRUM_RINKEBY]: memoize(
    () =>
      new ethers.providers.JsonRpcProvider(
        `https://arbitrum-rinkeby.infura.io/v3/${process.env.REACT_APP_PUBLIC_INFURA_ID}`
      )
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

export const POOL_LIST: Token[] = [
  {
    address: ethers.constants.AddressZero,
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
    logoURI: ethereumLogo,
    bridgePool: "0x75a29a66452C80702952bbcEDd284C8c4CF5Ab17",
  },
  {
    address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    logoURI: usdcLogo,
    bridgePool: "0x54d8d0a00b8288b49694a765C59694ddE8e4B931",
  },
  {
    address: "0x04Fa0d235C4abf4BcF4787aF4CF447DE572eF828",
    name: "UMA Token",
    symbol: "UMA",
    decimals: 18,
    logoURI: umaLogo,
    bridgePool: "0x4495C9F0C10D82823a2Dc5658615874a5B48bFA0",
  },
];
