export type PoolStateResult = {
  estimatedApy: string;
  exchangeRateCurrent: string;
  totalPoolSize: string;
  liquidityUtilizationCurrent: string;
};

export type PoolStateOfUser = {
  address: string;
  poolAddress: string;
  lpTokens: string;
  positionValue: string;
  totalDeposited: string;
  feesEarned: string;
};

export type TokenInfo = {
  symbol: string;
  address: string;
  decimals: number;
  name: string;
  addresses: Record<number, string>;
};
