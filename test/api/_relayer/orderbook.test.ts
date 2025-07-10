import orderbookHandler from "../../../api/relayer/orderbook";
import { TypedVercelRequest } from "../../../api/_types";
import { redisCache } from "../../../api/_cache";
import { getTokenByAddress } from "../../../api/_utils";
import { getBaseCurrency } from "../../../api/relayer/_utils";

jest.mock("../../../api/_cache", () => ({
  redisCache: {
    getAll: jest.fn(),
  },
}));

jest.mock("../../../api/_utils", () => ({
  ...jest.requireActual("../../../api/_utils"),
  getTokenByAddress: jest.fn(),
}));

jest.mock("../../../api/relayer/_utils", () => ({
  getBaseCurrency: jest.fn(),
}));

const getMockedResponse = () => {
  const response: any = {};
  response.status = jest.fn().mockReturnValue(response);
  response.send = jest.fn();
  response.setHeader = jest.fn();
  response.json = jest.fn();
  return response;
};

const createMockRequest = (query: any) => {
  return {
    query,
  } as unknown as TypedVercelRequest<any>;
};

describe("Orderbook Handler", () => {
  let response: any;
  let mockRedisCache: jest.Mocked<typeof redisCache>;
  let mockGetTokenByAddress: jest.MockedFunction<typeof getTokenByAddress>;

  beforeEach(() => {
    response = getMockedResponse();
    mockRedisCache = redisCache as jest.Mocked<typeof redisCache>;
    mockGetTokenByAddress = getTokenByAddress as jest.MockedFunction<
      typeof getTokenByAddress
    >;

    jest.clearAllMocks();
  });

  describe("Successful orderbook generation", () => {
    beforeEach(() => {
      mockGetTokenByAddress
        .mockReturnValueOnce({
          symbol: "USDC",
          decimals: 6,
          name: "USD Coin",
          addresses: { 1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
          coingeckoId: "usd-coin",
        })
        .mockReturnValueOnce({
          symbol: "USDT",
          decimals: 6,
          name: "Tether USD",
          addresses: { 10: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58" },
          coingeckoId: "tether",
        });

      (
        getBaseCurrency as jest.MockedFunction<typeof getBaseCurrency>
      ).mockReturnValue("usd");

      mockRedisCache.getAll.mockResolvedValue([
        {
          prices: {
            "1": {
              origin: {
                usd: {
                  USDC: {
                    "100": 0.99,
                    "50": 0.98,
                  },
                },
              },
              destination: {
                usd: {
                  USDT: {
                    "150": 1.02,
                  },
                },
              },
              messageExecution: true,
            },
            "10": {
              origin: {
                usd: {
                  USDC: {
                    "100": 0.99,
                    "50": 0.98,
                  },
                },
              },
              destination: {
                usd: {
                  USDT: {
                    "150": 1.02,
                  },
                },
              },
              messageExecution: true,
            },
          },
          minExclusivityPeriods: {
            default: 10,
          },
          authentication: {
            address: "0x000000000000000000000000000000000000000A",
            method: "signature",
            payload: {},
          },
        },
        {
          prices: {
            "1": {
              origin: {
                usd: {
                  USDC: {
                    "100": 0.97,
                    "50": 0.96,
                  },
                },
              },
              destination: {
                usd: {
                  USDT: {
                    "150": 1.01,
                  },
                },
              },
              messageExecution: true,
            },
          },
          minExclusivityPeriods: {
            default: 12,
          },
          authentication: {
            address: "0x000000000000000000000000000000000000000B",
            method: "signature",
            payload: {},
          },
        },
      ]);
    });

    test("should generate orderbook with spreads for matching relayers", async () => {
      const request = createMockRequest({
        originChainId: 1,
        destinationChainId: 10,
        originToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        destinationToken: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
      });

      await orderbookHandler(request, response);

      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith({
        "0x000000000000000000000000000000000000000A": [
          { amount: 100, spread: 0.030000000000000027 },
          { amount: 50, spread: 0.040000000000000036 },
        ],
      });
    });
  });
});
