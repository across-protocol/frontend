export type PoolStateResult = {
  estimatedApy: string;
  exchangeRateCurrent: string;
  totalPoolSize: string;
};

export type MessagePayload = {
  message: string;
  recipientAddress: string;
  relayerAddress?: string;
};
