export type RelayerFillLimit = {
  maxFillSize?: number;
  minProfitThreshold?: number;
  balanceMultiplier?: number;
};

export type RelayerFillConfig = Required<RelayerFillLimit> & {
  originChainIds: number[];
  tokens: {
    [inputToken: string]: RelayerFillLimit & {
      originChainIds: number[];
      [originChainId: number] : {
        [destinationChainId: number]: RelayerFillLimit & {
          [outputToken: string]: { [maxFillSize: number]: number };
        };
      };
    };
  };
};

POST: api/relayer/config/<token>/<originChainId>



export const SampleConfig: RelayerFillConfig = {
  originChainIds: [1, 10, 137],
  maxFillSize: 10_000, // USD
  minProfitThreshold: 0.0001, // 1bps
  balanceMultiplier: 0.5,





  tokens: {
    USDC: {
      balanceMultiplier: 0.3,
      10: {
        42161: {
          USDC: {
            100: 0.0001,
            1000: 0.0002,
            10000: 0.0005,
          },
          "USDC.e": {
            100: 0.0002,
            1000: 0.0006,
          }
        },
        59144: {
          "USDC": {
            100: 0.0002,
            1000: 0.0005,
          }
        }
      },
    },
  },
};
