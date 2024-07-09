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
  spokePool: string;
  tokens: (
    | string
    | {
        symbol: string;
        chainIds: number[];
      }
  )[];
  enableCCTP: boolean;
  swapTokens: {
    swapInputTokenSymbol: string;
    acrossInputTokenSymbol: string;
    acrossOutputTokenSymbol: string;
  }[];
};
