export type ChainConfig = {
  name: string;
  fullName?: string;
  nativeToken: string;
  blockExplorer: string;
  blockTimeSeconds?: number;
  publicRpcUrl: string;
  chainId: number;
  logoPath: string;
  grayscaleLogoPath: string;
  spokePool: {
    address: string;
    blockNumber: number;
  };
  tokens: (
    | string
    | {
        symbol: string;
        chainIds: number[];
      }
  )[];
  enableCCTP: boolean;
  disabledRoutes?: {
    toChainId: number;
    fromTokenSymbol: string;
    toTokenSymbol: string;
  }[];
};
