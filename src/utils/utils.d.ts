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
