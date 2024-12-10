export type RelayerFillLimit = {
  originChainId: number;
  inputToken: string;
  destinationChainId: number;
  outputToken: string;
  minOutputAmount?: number;
  maxOutputAmount?: number;
  minExclusivityPeriod?: number;
  minProfitThreshold?: number;
  balanceMultiplier?: number;
  msgFill?: boolean;
};

// Example config.
export const RelayerConfigUpdate: RelayerFillLimit[] = [
  {
    originChainId: 1,
    inputToken: "",
    destinationChainId: 42161,
    outputToken: "",
    minExclusivityPeriod: 20,
    minProfitThreshold: 0.0003,
    balanceMultiplier: 0.6,
    maxOutputAmount: 2500,
  },
  {
    originChainId: 10,
    inputToken: "",
    destinationChainId: 42161,
    outputToken: "",
    minExclusivityPeriod: 5,
    minProfitThreshold: 0.0003,
    balanceMultiplier: 0.6,
    maxOutputAmount: 2500,
  },
  {
    originChainId: 137,
    inputToken: "",
    destinationChainId: 42161,
    outputToken: "",
    minExclusivityPeriod: 5,
    minProfitThreshold: 0.0003,
    balanceMultiplier: 0.6,
    maxOutputAmount: 2500,
  },
  {
    originChainId: 324,
    inputToken: "",
    destinationChainId: 42161,
    outputToken: "",
    minExclusivityPeriod: 5,
    minProfitThreshold: 0.0003,
    balanceMultiplier: 0.6,
    maxOutputAmount: 2500,
  },
];
