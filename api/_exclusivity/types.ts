export type ExclusiveRelayer = {
  exclusiveRelayer: string;
  exclusivityPeriod: number; // Absolute number of seconds of exclusivity from deposit time.
};

// Initial relayer configuration items.
export type RelayerConfig = {
  address: string;
  minExclusivityPeriod: number;
  minProfitThreshold: number;
  balanceMultiplier: number;
  maxFillSize: number;
  originChainIds: number[];
};

export type CandidateRelayer = {
  address: string;
  dynamicWeight: number;
  fixedWeight: number;
};

export type RelayerSelector = (relayers: string[]) => string;
