import axios from "axios";
import { vercelApiBaseUrl } from "utils";

export type RelayerConfigsApiCall = typeof relayerConfigsApiCall;

export type RelayerConfigsApiResponse = {
  authentication: {
    address: string;
    method: string;
  };
  updatedAt: number;
  prices: {
    [chainId: number]: {
      origin: {
        [baseCurrency: string]: {
          [token: string]: {
            [amount: number]: number;
          };
        };
      };
      destination: {
        [baseCurrency: string]: {
          [token: string]: {
            [amount: number]: number;
          };
        };
      };
    };
  };
  minExclusivityPeriods: {
    default: number;
    routes?: {
      [route: string]: {
        [amount: number]: number;
      };
    };
    origin?: {
      [chainId: number]: {
        [amount: number]: number;
      };
    };
    destination?: {
      [chainId: number]: {
        [amount: number]: number;
      };
    };
    sizes?: {
      [amount: number]: number;
    };
  };
}[];

export async function relayerConfigsApiCall(): Promise<RelayerConfigsApiResponse> {
  const { data } = await axios.get<RelayerConfigsApiResponse>(
    `${vercelApiBaseUrl}/api/relayer-config-list`
  );
  return data;
  // return createMockData() as RelayerConfigsApiResponse;
}

function createMockData() {
  const relayerAddresses = [
    "0x000000000000000000000000000000000000000A",
    "0x000000000000000000000000000000000000000B",
    "0x000000000000000000000000000000000000000C",
    "0x000000000000000000000000000000000000000D",
    "0x000000000000000000000000000000000000000E",
    "0x000000000000000000000000000000000000000F",
    "0x0000000000000000000000000000000000000010",
    "0x0000000000000000000000000000000000000011",
    "0x0000000000000000000000000000000000000012",
  ];
  const tokens = ["USDC", "USDT", "DAI"];
  const chains = [1, 10, 42161];

  // random number between a and b, with 2 decimal places
  const randomPrice = (a: number, b: number) =>
    Number((Math.random() * (b - a) + a).toFixed(2));

  return relayerAddresses.map((relayerAddress) => {
    const prices = chains.reduce((acc, chain) => {
      const origin = tokens.reduce((acc, token) => {
        return {
          ...acc,
          [token]: {
            [100]: randomPrice(0.9, 0.95),
            [200]: randomPrice(0.951, 0.99),
          },
        };
      }, {});
      const destination = tokens.reduce((acc, token) => {
        return {
          ...acc,
          [token]: {
            [100]: randomPrice(1.01, 1.05),
            [200]: randomPrice(1.051, 1.09),
          },
        };
      }, {});
      return {
        ...acc,
        [chain]: {
          origin: {
            usd: origin as any,
          },
          destination: {
            usd: destination as any,
          },
        },
      };
    }, {});
    return {
      relayer: relayerAddress,
      config: {
        updatedAt: Date.now() - Math.floor(Math.random() * 10000),
        prices,
        minExclusivityPeriods: {
          default: 12,
        },
      },
    };
  });
}
