import { ethers } from "ethers";
import assert from "assert";
import { Initialization } from "bnc-onboard/dist/src/interfaces";
import * as acrossSdk from "@across-protocol/sdk-v2";
import ethereumLogo from "assets/ethereum-logo.svg";
import optimismLogo from "assets/optimism-alt-logo.svg";
import wethLogo from "assets/weth-logo.svg";
import arbitrumLogo from "assets/arbitrum-logo.svg";
import memoize from "lodash-es/memoize";
import bobaLogo from "assets/boba-logo.svg";
import polygonLogo from "assets/polygon-logo.svg";
import { getAddress } from "./address";
import rawTokens from "../data/tokens.json";
import PREFERRED_TOKEN_ORDER from "../data/token-order.json";
import * as superstruct from "superstruct";
import { Provider } from "@across-protocol/sdk-v2/dist/pool";

/* Colors and Media Queries section */

export const AddressZero = ethers.constants.AddressZero;
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

export type Token = {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
};
// enforce weth to be first so we can use it as a guarantee in other parts of the app
export type TokenList = [
  {
    address: string;
    symbol: "WETH";
    name: "Wrapped Ether";
    decimals: 18;
    logoURI: typeof wethLogo;
  },
  ...Token[]
];

const TokensList = superstruct.array(
  superstruct.object({
    address: superstruct.string(),
    symbol: superstruct.string(),
    name: superstruct.string(),
    decimals: superstruct.number(),
    logoURI: superstruct.string(),
  })
);
export function isSupportedChainId(chainId: number): chainId is ChainId {
  return chainId in ChainId;
}

function processRawTokens(
  tokens: typeof rawTokens
): Record<ChainId, TokenList> {
  return Object.entries(tokens).reduce((record, [rawChainId, rawTokens]) => {
    const chainId: ChainId = Number(rawChainId);
    if (!isSupportedChainId(chainId)) {
      throw new Error(`Unsupported chainId: ${chainId}`);
    }
    const tokens = PREFERRED_TOKEN_ORDER.map((symbol) => {
      const rawToken = rawTokens.find((token) => token.symbol === symbol);
      if (!rawToken) {
        return null;
      }
      return {
        ...rawToken,
        logoURI: process.env.PUBLIC_URL + rawToken.logoURI,
      };
    }).filter(Boolean);
    superstruct.assert(tokens, TokensList);
    return { ...record, [chainId]: tokens };
  }, {} as Record<ChainId, TokenList>);
}

export const TOKENS_LIST: Record<ChainId, TokenList> =
  processRawTokens(rawTokens);

export type ChainInfo = {
  name: string;
  fullName?: string;
  chainId: ChainId;
  nativeCurrencyAddress: string;
  logoURI: string;
  rpcUrl?: string;
  explorerUrl: string;
  constructExplorerLink: (txHash: string) => string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  pollingInterval?: number;
};

const defaultConstructExplorerLink =
  (explorerUrl: string) => (txHash: string) =>
    `${explorerUrl}/tx/${txHash}`;

export const isProduction = () =>
  process.env.REACT_APP_VERCEL_GIT_COMMIT_REF === "master";

export const CHAINS: Record<ChainId, ChainInfo> = {
  [ChainId.MAINNET]: {
    name: "Ethereum",
    fullName: "Ethereum Mainnet",
    chainId: ChainId.MAINNET,
    logoURI: ethereumLogo,
    explorerUrl: "https://etherscan.io",
    constructExplorerLink: defaultConstructExplorerLink("https://etherscan.io"),
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    nativeCurrencyAddress: ethers.constants.AddressZero,
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
    nativeCurrencyAddress: ethers.constants.AddressZero,
  },
  [ChainId.ARBITRUM]: {
    name: "Arbitrum",
    fullName: "Arbitrum One",
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
    nativeCurrencyAddress: ethers.constants.AddressZero,
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
    nativeCurrencyAddress: ethers.constants.AddressZero,
  },
  [ChainId.POLYGON]: {
    name: "Polygon",
    fullName: "Polygon Network",
    chainId: ChainId.POLYGON,
    logoURI: polygonLogo,
    rpcUrl: "https://rpc.ankr.com/polygon",
    explorerUrl: "https://polygonscan.com",
    constructExplorerLink: defaultConstructExplorerLink(
      "https://polygonscan.com"
    ),
    nativeCurrency: {
      name: "Matic",
      symbol: "MATIC",
      decimals: 18,
    },
    nativeCurrencyAddress: ethers.constants.AddressZero,
  },
  [ChainId.RINKEBY]: {
    name: "Rinkeby",
    fullName: "Rinkeby Testnet",
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
    nativeCurrencyAddress: ethers.constants.AddressZero,
  },
  [ChainId.KOVAN]: {
    name: "Kovan",
    fullName: "Ethereum Testnet Kovan",
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
    nativeCurrencyAddress: ethers.constants.AddressZero,
  },
  [ChainId.KOVAN_OPTIMISM]: {
    name: "Optimism Kovan",
    fullName: "Optimism Testnet Kovan",
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
    nativeCurrencyAddress: ethers.constants.AddressZero,
  },
  [ChainId.ARBITRUM_RINKEBY]: {
    name: "Arbitrum Rinkeby",
    fullName: "Arbitrum Testnet Rinkeby",
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
    nativeCurrencyAddress: ethers.constants.AddressZero,
  },
  [ChainId.GOERLI]: {
    name: "Goerli",
    fullName: "Goerli Testnet",
    chainId: ChainId.GOERLI,
    logoURI: ethereumLogo,
    explorerUrl: "https://goerli.etherscan.io/",
    constructExplorerLink: defaultConstructExplorerLink(
      "https://goerli.etherscan.io/"
    ),
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    nativeCurrencyAddress: ethers.constants.AddressZero,
  },
  [ChainId.MUMBAI]: {
    name: "Mumbai",
    chainId: ChainId.MUMBAI,
    logoURI: polygonLogo,
    rpcUrl: "https://matic-mumbai.chainstacklabs.com",
    explorerUrl: "https://mumbai.polygonscan.com",
    constructExplorerLink: defaultConstructExplorerLink(
      "https://mumbai.polygonscan.com"
    ),
    nativeCurrency: {
      name: "Matic",
      symbol: "MATIC",
      decimals: 18,
    },
    nativeCurrencyAddress: ethers.constants.AddressZero,
  },
};

const PRODUCTION_CHAINS_SELECTION = [
  ChainId.OPTIMISM,
  ChainId.ARBITRUM,
  ChainId.BOBA,
  ChainId.POLYGON,
  ChainId.MAINNET,
];
export const TESTNET_CHAINS_SELECTION = [
  ChainId.RINKEBY,
  ChainId.KOVAN,
  ChainId.KOVAN_OPTIMISM,
  ChainId.ARBITRUM_RINKEBY,
  ChainId.GOERLI,
  ChainId.MUMBAI,
];
/** Chains as they appear in dropdowns */
export const CHAINS_SELECTION = isProduction()
  ? PRODUCTION_CHAINS_SELECTION
  : [...PRODUCTION_CHAINS_SELECTION, ...TESTNET_CHAINS_SELECTION];

/** FIXME:  use the actual spoke pool addresses!!!! */
export const SPOKE_ADDRESSES: Record<ChainId, string> = {
  [ChainId.MAINNET]: ethers.constants.AddressZero,
  [ChainId.ARBITRUM]: ethers.constants.AddressZero,
  [ChainId.OPTIMISM]: ethers.constants.AddressZero,
  [ChainId.BOBA]: ethers.constants.AddressZero,
  [ChainId.POLYGON]: ethers.constants.AddressZero,
  [ChainId.RINKEBY]: getAddress("0x90743806D7A66b37F31FAfd7b3447210aB55640f"),
  [ChainId.KOVAN]: getAddress("0x73549B5639B04090033c1E77a22eE9Aa44C2eBa0"),
  [ChainId.KOVAN_OPTIMISM]: getAddress(
    "0x2b7b7bAE341089103dD22fa4e8D7E4FA63E11084"
  ),
  [ChainId.ARBITRUM_RINKEBY]: getAddress(
    "0x3BED21dAe767e4Df894B31b14aD32369cE4bad8b"
  ),
  [ChainId.GOERLI]: ethers.constants.AddressZero,
  [ChainId.MUMBAI]: getAddress("0xFd9e2642a170aDD10F53Ee14a93FcF2F31924944"),
};
// Update once addresses are known
export const HUBPOOL_ADDRESSES: Record<ChainId, string> = {
  [ChainId.MAINNET]: getAddress("0xD449Af45a032Df413b497A709EeD3E8C112EbcE3"),
  [ChainId.OPTIMISM]: ethers.constants.AddressZero,
  [ChainId.BOBA]: ethers.constants.AddressZero,
  [ChainId.ARBITRUM]: ethers.constants.AddressZero,
  [ChainId.RINKEBY]: getAddress("0xa1b6DA4AaE90fA16F3A3338c8d1Dc70B4926FCa7"),
  [ChainId.POLYGON]: ethers.constants.AddressZero,
  [ChainId.KOVAN]: getAddress("0xD449Af45a032Df413b497A709EeD3E8C112EbcE3"),
  [ChainId.KOVAN_OPTIMISM]: ethers.constants.AddressZero,
  [ChainId.ARBITRUM_RINKEBY]: ethers.constants.AddressZero,
  [ChainId.GOERLI]: getAddress("0x69CA24D3084a2eea77E061E2D7aF9b76D107b4f6"),
  [ChainId.MUMBAI]: ethers.constants.AddressZero,
};
// Update once addresses are known
export const RATEMODEL_ADDRESSES: Record<ChainId, string> = {
  [ChainId.MAINNET]: ethers.constants.AddressZero,
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

type GetProvider = () => ethers.providers.JsonRpcProvider;
export const PROVIDERS: Record<ChainId, GetProvider> = {
  [ChainId.MAINNET]: memoize(
    () =>
      new ethers.providers.StaticJsonRpcProvider(
        `https://mainnet.infura.io/v3/${process.env.REACT_APP_PUBLIC_INFURA_ID}`
      )
  ),
  [ChainId.OPTIMISM]: memoize(
    () =>
      new ethers.providers.StaticJsonRpcProvider(
        `https://optimism-mainnet.infura.io/v3/${process.env.REACT_APP_PUBLIC_INFURA_ID}`
      )
  ),
  [ChainId.ARBITRUM]: memoize(
    () =>
      new ethers.providers.StaticJsonRpcProvider(
        `https://arbitrum-mainnet.infura.io/v3/${process.env.REACT_APP_PUBLIC_INFURA_ID}`
      )
  ),
  // Doesn't have an rpc on infura.
  [ChainId.BOBA]: memoize(
    () =>
      new ethers.providers.StaticJsonRpcProvider(`https://mainnet.boba.network`)
  ),
  [ChainId.POLYGON]: memoize(
    () =>
      new ethers.providers.StaticJsonRpcProvider(
        `https://polygon-mainnet.infura.io/v3/${process.env.REACT_APP_PUBLIC_INFURA_ID}`
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
  [ChainId.KOVAN_OPTIMISM]: memoize(
    () =>
      new ethers.providers.StaticJsonRpcProvider(
        `https://optimism-kovan.infura.io/v3/${process.env.REACT_APP_PUBLIC_INFURA_ID}`
      )
  ),
  [ChainId.ARBITRUM_RINKEBY]: memoize(
    () =>
      new ethers.providers.StaticJsonRpcProvider(
        `https://arbitrum-rinkeby.infura.io/v3/${process.env.REACT_APP_PUBLIC_INFURA_ID}`
      )
  ),
  [ChainId.GOERLI]: memoize(
    () =>
      new ethers.providers.StaticJsonRpcProvider(
        `https://goerli.infura.io/v3/${process.env.REACT_APP_PUBLIC_INFURA_ID}`
      )
  ),
  [ChainId.MUMBAI]: memoize(
    () =>
      new ethers.providers.StaticJsonRpcProvider(
        `https://polygon-mumbai.infura.io/v3/${process.env.REACT_APP_PUBLIC_INFURA_ID}`
      )
  ),
};

export const DEFAULT_FROM_CHAIN_ID = ChainId.OPTIMISM;
export const DEFAULT_TO_CHAIN_ID = ChainId.MAINNET;

/* Onboard config */

export function onboardBaseConfig(): Initialization {
  // const infuraRpc = PROVIDERS[DEFAULT_FROM_CHAIN_ID]().connection.url;
  return {
    dappId: process.env.REACT_APP_PUBLIC_ONBOARD_API_KEY || "",
    networkId: DEFAULT_FROM_CHAIN_ID,
    hideBranding: true,
    walletSelect: {
      wallets: [
        { walletName: "metamask", preferred: true },
        {
          walletName: "walletConnect",
          rpc: {
            1: `https://mainnet.infura.io/v3/${process.env.REACT_APP_PUBLIC_INFURA_ID}`,
            10: `https://optimism-mainnet.infura.io/v3/${process.env.REACT_APP_PUBLIC_INFURA_ID}`,
            288: `https://mainnet.boba.network/`,
            42161: `https://arbitrum-mainnet.infura.io/v3/${process.env.REACT_APP_PUBLIC_INFURA_ID}`,
          },
          preferred: true,
        },
        // { walletName: "coinbase", preferred: true },
        { walletName: "tally", preferred: true },
      ],
    },
    walletCheck: [{ checkName: "connect" }, { checkName: "accounts" }],
    // To prevent providers from requesting block numbers every 4 seconds (see https://github.com/WalletConnect/walletconnect-monorepo/issues/357)
    blockPollingInterval: 1000 * 60 * 60,
  };
}

// this client requires multicall2 be accessible on the chain. This is the address for mainnet.
export const multicallTwoAddress = "0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696";

export const MAX_APPROVAL_AMOUNT = ethers.constants.MaxUint256;
export const FEE_ESTIMATION = ".004";
export const CONFIRMATIONS =
  Number(process.env.REACT_APP_PUBLIC_CONFIRMATIONS) || 1;

export function makePoolClientConfig(chainId: ChainId): acrossSdk.pool.Config {
  const weth = TOKENS_LIST[chainId].find((x: Token) => x.symbol === "WETH");
  assert(weth, "WETH address not found on chain " + chainId);
  assert(
    weth.address !== ethers.constants.AddressZero,
    "WETH address not set on chain " + chainId
  );

  const hubPoolAddress = ethers.utils.getAddress(HUBPOOL_ADDRESSES[chainId]);
  assert(
    hubPoolAddress,
    "hubPoolAddress address not found on chain " + chainId
  );
  assert(
    hubPoolAddress !== ethers.constants.AddressZero,
    "hubPoolAddress address not set on chain " + chainId
  );

  const rateModelStoreAddress = ethers.utils.getAddress(
    RATEMODEL_ADDRESSES[chainId]
  );
  assert(
    rateModelStoreAddress,
    "rateModelStoreAddress address not found on chain " + chainId
  );
  assert(
    rateModelStoreAddress !== ethers.constants.AddressZero,
    "rateModelStoreAddress address not set on chain " + chainId
  );

  return {
    chainId,
    hubPoolAddress,
    wethAddress: ethers.utils.getAddress(weth.address),
    rateModelStoreAddress,
  };
}
// default to kovan when testing
// FIXME: Switch to Mainnet in prod, when we have a mainnet hub pool
export const HUBPOOL_CHAINID = isProduction() ? ChainId.KOVAN : ChainId.KOVAN;
export const HUBPOOL_CONFIG = makePoolClientConfig(HUBPOOL_CHAINID);
export const disableDeposits = process.env.REACT_APP_DISABLE_DEPOSITS;

interface txHistoryConfig {
  chainId: number;
  provider: Provider;
  spokePoolContractAddr: string;
  lowerBoundBlockNumber?: number;
}
// Chains currently in SDK v2
/*  
const SPOKE_CHAINS = {
  [ChainId.ARBITRUM_RINKEBY]: { lowerBoundBlockNumber: 9828565 },
  [ChainId.KOVAN_OPTIMISM]: { lowerBoundBlockNumber: 0 },
  [ChainId.RINKEBY]: { lowerBoundBlockNumber: 0 },
  [ChainId.KOVAN]: { lowerBoundBlockNumber: 0 },
  [ChainId.MAINNET]: { lowerBoundBlockNumber: 0 },
};
*/
export function createTxHistoryClient() {
  const txHistoryConfigs: txHistoryConfig[] = [
    {
      chainId: ChainId.ARBITRUM_RINKEBY,
      provider: PROVIDERS[ChainId.ARBITRUM_RINKEBY](),
      spokePoolContractAddr: SPOKE_ADDRESSES[ChainId.ARBITRUM_RINKEBY],
      lowerBoundBlockNumber: 10523275,
    },
    {
      chainId: ChainId.KOVAN_OPTIMISM,
      provider: PROVIDERS[ChainId.KOVAN_OPTIMISM](),
      spokePoolContractAddr: SPOKE_ADDRESSES[ChainId.KOVAN_OPTIMISM],
      lowerBoundBlockNumber: 1618630,
    },
    {
      chainId: ChainId.RINKEBY,
      provider: PROVIDERS[ChainId.RINKEBY](),
      spokePoolContractAddr: SPOKE_ADDRESSES[ChainId.RINKEBY],
    },
    {
      chainId: ChainId.KOVAN,
      provider: PROVIDERS[ChainId.KOVAN](),
      spokePoolContractAddr: SPOKE_ADDRESSES[ChainId.KOVAN],
      lowerBoundBlockNumber: 30475937,
    },
  ];

  return txHistoryConfigs;
}

export const enableReactQueryDevTools =
  process.env.REACT_APP_ENABLE_REACT_QUERY_DEV_TOOLS;
