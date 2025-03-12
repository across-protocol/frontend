import { PUBLIC_NETWORKS } from "@across-protocol/constants";

type BaseChainConfig = (typeof PUBLIC_NETWORKS)[number];

export type ChainConfig = BaseChainConfig & {
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
};
