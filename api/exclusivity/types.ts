export type ExclusiveRelayer = {
  exclusiveRelayer: string;
  exclusivityPeriod: number; // Absolute number of seconds of exclusivity from deposit time.
};

export type RelayerSelector = (relayers: string[]) => string;
