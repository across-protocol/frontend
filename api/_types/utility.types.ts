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
