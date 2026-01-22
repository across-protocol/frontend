export type LimitsResponse = {
  minDeposit: string;
  maxDeposit: string;
  maxDepositInstant: string;
  maxDepositShortDelay: string;
  recommendedDepositInstant: string;
  relayerFeeDetails: {
    relayFeeTotal: string;
    relayFeePercent: string;
    capitalFeePercent: string;
    capitalFeeTotal: string;
    gasFeePercent: string;
    gasFeeTotal: string;
  };
  reserves: {
    liquidReserves: string;
    utilizedReserves: string;
  };
};
