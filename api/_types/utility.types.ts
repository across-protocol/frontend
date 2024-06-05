export type PoolStateResult = {
  estimatedApy: string;
  exchangeRateCurrent: string;
  totalPoolSize: string;
};

export type DepositLog = {
  depositId: number;
  depositor: string;
  recipient: string;
  hash: string;
  destinationChainId: number;
  originChainId: number;
  blockTimestamp: number;
  fillDeadline: number;
  l1Token: string;
};
