import { Initialization } from "bnc-onboard/dist/src/interfaces";
import { ethers } from "ethers";
import ethereumLogo from "../assets/ethereum-logo.png";
import usdcLogo from "../assets/usdc-logo.png";
import optimismLogo from "../assets/optimism.svg";
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
  grayLightest: "0deg 0% 89%",
  gray: "230deg 6% 19%",
  grayLight: "240deg 2% 39%",
  primary: "166deg 92% 70%",
  primaryDark: "180deg 15% 25%",
  secondary: "266deg 77% 62%",
  white: "0deg 100% 100%",
  black: "0deg 0% 0%",
  error: "11deg 92% 70%",
  errorLight: "11deg 93% 94%",
};

export const infuraId =
  process.env.REACT_APP_PUBLIC_INFURA_ID || "d5e29c9b9a9d4116a7348113f57770a8";

const getNetworkName = (chainId: number) => {
  switch (chainId) {
    case 1: {
      return "mainnet";
    }
    case 42: {
      return "kovan";
    }
    case 3: {
      return "ropsten";
    }
    case 4: {
      return "rinkeby";
    }
  }
};
export function onboardBaseConfig(_chainId?: number): Initialization {
  const chainId = _chainId ?? 1;
  const infuraRpc = `https://${getNetworkName(
    chainId
  )}.infura.io/v3/${infuraId}`;

  return {
    dappId: process.env.NEXT_PUBLIC_ONBOARD_API_KEY || "",
    hideBranding: true,
    networkId: 10, // Default to main net. If on a different network will change with the subscription.
    walletSelect: {
      wallets: [
        { walletName: "metamask", preferred: true },
        {
          walletName: "walletConnect",
          rpc: { [chainId || 1]: infuraRpc },
        },
        { walletName: "gnosis" },
      ],
    },
    walletCheck: [
      { checkName: "connect" },
      { checkName: "accounts" },
      { checkName: "network" },
      { checkName: "balance", minimumBalance: "0" },
    ],
    // To prevent providers from requesting block numbers every 4 seconds (see https://github.com/WalletConnect/walletconnect-monorepo/issues/357)
    blockPollingInterval: 1000 * 60 * 60,
  };
}

type Coin = {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
};
// Adapted from Coingecko token list here: https://tokens.coingecko.com/uniswap/all.json
export const COIN_LIST: Record<number, Coin[]> = {
  1: [
    {
      address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      name: "USD Coin",
      symbol: "USDC",
      decimals: 6,
      logoURI: usdcLogo,
    },
    {
      decimals: 18,
      name: "Ether",
      symbol: "ETH",
      logoURI: ethereumLogo,
      address: ethers.constants.AddressZero,
    },
  ],
  42: [
    {
      address: "0x08ae34860fbfe73e223596e65663683973c72dd3",
      name: "DAI Stablecoin",
      symbol: "DAI",
      decimals: 18,
      logoURI: usdcLogo,
    },
    {
      decimals: 18,
      name: "Ether",
      symbol: "ETH",
      logoURI: ethereumLogo,
      address: ethers.constants.AddressZero,
    },
  ],
  10: [
    {
      address: "0x7f5c764cbc14f9669b88837ca1490cca17c31607",
      name: "USD Coin",
      symbol: "USDC",
      decimals: 6,
      logoURI: usdcLogo,
    },
    {
      decimals: 18,
      name: "Ether",
      symbol: "ETH",
      logoURI: ethereumLogo,
      address: ethers.constants.AddressZero,
    },
  ],
  69: [
    {
      address: "0x2a41F55E25EfEE3E53834140c0bD81dBF3464831",
      name: "DAI (L2 Dai)",
      symbol: "DAI",
      decimals: 18,
      logoURI: usdcLogo,
    },
    {
      decimals: 18,
      name: "Ether",
      symbol: "ETH",
      logoURI: ethereumLogo,
      address: ethers.constants.AddressZero,
    },
  ],
};

export const PROVIDERS: Record<number, ethers.providers.BaseProvider> = {
  10: new ethers.providers.JsonRpcProvider(
    `https://optimism-mainnet.infura.io/v3/${process.env.REACT_APP_PUBLIC_INFURA_ID}`
  ),
  69: new ethers.providers.JsonRpcProvider(
    `https://optimism-kovan.infura.io/v3/${process.env.REACT_APP_PUBLIC_INFURA_ID}`
  ),
  1: new ethers.providers.JsonRpcProvider(
    `https://mainnet.infura.io/v3/${process.env.REACT_APP_PUBLIC_INFURA_ID}`
  ),
};

export const ADDRESSES: Record<number, { BRIDGE: string }> = {
  10: {
    BRIDGE: "",
  },
  69: {
    BRIDGE: "0x2271a5E74eA8A29764ab10523575b41AA52455f0",
  },
};

type NativeCurrency = {
  name: string;
  symbol: string;
  decimals: 18;
};
type Chain = {
  chainId: number;
  name: string;
  logoURI: string;
  rpcUrl?: string;
  explorerUrl: string;
  constructExplorerLink: (txHash: string) => string;
  nativeCurrency: NativeCurrency;
};

export const CHAINS: Record<number, Chain> = {
  1: {
    name: "Ethereum Mainnet",
    chainId: 1,
    logoURI: ethereumLogo,
    explorerUrl: "https://etherscan.io/",
    constructExplorerLink: (txHash: string) =>
      `https://etherscan.io/tx/${txHash}`,
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  42: {
    name: "Ethereum Testnet Kovan",
    chainId: 42,
    logoURI: ethereumLogo,
    explorerUrl: "https://kovan.etherscan.io",
    constructExplorerLink: (txHash: string) =>
      `https://kovan.etherscan.io/tx/${txHash}`,
    nativeCurrency: {
      name: "Kovan Ethereum",
      symbol: "KOV",
      decimals: 18,
    },
  },
  10: {
    name: "Optimistic Ethereum",
    chainId: 10,
    logoURI: optimismLogo,
    rpcUrl: "https://mainnet.optimism.io",
    explorerUrl: "https://optimistic.etherscan.io/",
    constructExplorerLink: (txHash: string) =>
      `https://optimistic.etherscan.io/tx/${txHash}`,
    nativeCurrency: {
      name: "Ether",
      symbol: "OETH",
      decimals: 18,
    },
  },
  69: {
    name: "Optimistic Ethereum Testnet Kovan",
    chainId: 69,
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
};
