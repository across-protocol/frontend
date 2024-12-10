export type RelayerFillLimit = {
    maxFillSize?: number;
    minProfitThreshold?: number;
    balanceMultiplier?: number;
};


export type RelayerFillConfig = Required<RelayerFillLimit> & {
  originChainIds: number[];
  tokens: {
    [inputToken: string]: RelayerFillLimit & {
      originChainIds?: number[];
      [destinationChainId: number]: {
          [outputToken: string]: { [maxFillSize: number]: number },
      }
    }
  }
}

export const SampleConfig: RelayerFillConfig = {
  originChainIds: [1, 10, 137],
  maxFillSize: 10_000, // USD
  minProfitThreshold: 0.0001, // 1bps
  balanceMultiplier: 0.5, 

  tokens: {
    WETH: {
      // originChainIds: [59144],
      42161: {
        WETH: {
          500: 0.0005,
          1000: 0.001,
          10_000: 0.0001,
        },
      }
    },
    USDC: {
      42161: {
        "USDC.e" : {
            100: 0.0001,
         },
         USDC: {
            100: 0.0005,
         },
      }
    }
  }
}
