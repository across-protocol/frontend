import { getLimitsSpanAttributes } from "../../api/_utils";
import { Token } from "../../api/_dexes/types";

describe("getLimitsSpanAttributes", () => {
  test("should return the correct attributes with mocked prices", async () => {
    const mockGetCachedTokenPrice = async (params: {
      symbol?: string;
    }): Promise<number> => {
      if (params.symbol === "WBTC") {
        return 100000;
      }
      if (params.symbol === "WETH") {
        return 4000;
      }
      if (params.symbol === "ACX") {
        return 0.1;
      }
      return 0;
    };

    const wbtcToken: Token = {
      address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
      symbol: "WBTC",
      decimals: 8,
      chainId: 1,
    };

    const wethToken: Token = {
      address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      symbol: "WETH",
      decimals: 18,
      chainId: 1,
    };

    const acxToken: Token = {
      address: "0x44108f0223a3c3028f5fe7aec7f9bb2e66bef82f",
      symbol: "ACX",
      decimals: 18,
      chainId: 1,
    };

    const wbtcAttributes = await getLimitsSpanAttributes(
      {
        minDeposit: "1000000", // 0.01 WBTC
        maxDeposit: "100000000", // 1 WBTC
        maxDepositInstant: "10000000", // 0.1 WBTC
        maxDepositShortDelay: "50000000", // 0.5 WBTC
      },
      wbtcToken,
      { fetchTokenPrice: mockGetCachedTokenPrice }
    );

    expect(wbtcAttributes).toEqual({
      "limits.minDeposit.token": 0.01,
      "limits.minDeposit.usd": 1000,
      "limits.maxDeposit.token": 1,
      "limits.maxDeposit.usd": 100000,
      "limits.maxDepositInstant.token": 0.1,
      "limits.maxDepositInstant.usd": 10000,
      "limits.maxDepositShortDelay.token": 0.5,
      "limits.maxDepositShortDelay.usd": 50000,
    });

    const wethLimits = {
      minDeposit: "1000000000000000000", // 1 WETH
      maxDeposit: "100000000000000000000", // 100 WETH
      maxDepositInstant: "10000000000000000000", // 10 WETH
      maxDepositShortDelay: "50000000000000000000", // 50 WETH
    };

    const wethAttributes = await getLimitsSpanAttributes(
      wethLimits,
      wethToken,
      { fetchTokenPrice: mockGetCachedTokenPrice }
    );

    expect(wethAttributes).toEqual({
      "limits.minDeposit.token": 1,
      "limits.minDeposit.usd": 4000,
      "limits.maxDeposit.token": 100,
      "limits.maxDeposit.usd": 400000,
      "limits.maxDepositInstant.token": 10,
      "limits.maxDepositInstant.usd": 40000,
      "limits.maxDepositShortDelay.token": 50,
      "limits.maxDepositShortDelay.usd": 200000,
    });

    const acxLimits = {
      minDeposit: "1000000000000000000", // 1 ACX
      maxDeposit: "100000000000000000000", // 100 ACX
      maxDepositInstant: "10000000000000000000", // 10 ACX
      maxDepositShortDelay: "50000000000000000000", // 50 ACX
    };

    const acxAttributes = await getLimitsSpanAttributes(acxLimits, acxToken, {
      fetchTokenPrice: mockGetCachedTokenPrice,
    });

    expect(acxAttributes).toEqual({
      "limits.minDeposit.token": 1,
      "limits.minDeposit.usd": 0.1,
      "limits.maxDeposit.token": 100,
      "limits.maxDeposit.usd": 10,
      "limits.maxDepositInstant.token": 10,
      "limits.maxDepositInstant.usd": 1,
      "limits.maxDepositShortDelay.token": 50,
      "limits.maxDepositShortDelay.usd": 5,
    });
  });

  test("should return valid attributes with real prices", async () => {
    const original_env_variable =
      process.env.REACT_APP_VERCEL_API_BASE_URL_OVERRIDE;
    process.env.REACT_APP_VERCEL_API_BASE_URL_OVERRIDE = "https://across.to";
    const wethToken: Token = {
      address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      symbol: "WETH",
      decimals: 18,
      chainId: 1,
    };

    const wethLimits = {
      minDeposit: "1000000000000000000", // 1 WETH
      maxDeposit: "100000000000000000000", // 100 WETH
      maxDepositInstant: "10000000000000000000", // 10 WETH
      maxDepositShortDelay: "50000000000000000000", // 50 WETH
    };
    const attributes = await getLimitsSpanAttributes(wethLimits, wethToken);
    console.log(attributes);
    expect(typeof attributes["limits.minDeposit.token"]).toBe("number");
    expect(attributes["limits.minDeposit.token"]).toBeGreaterThan(0);
    expect(typeof attributes["limits.minDeposit.usd"]).toBe("number");
    expect(attributes["limits.minDeposit.usd"]).toBeGreaterThan(0);

    expect(typeof attributes["limits.maxDeposit.token"]).toBe("number");
    expect(attributes["limits.maxDeposit.token"]).toBeGreaterThan(0);
    expect(typeof attributes["limits.maxDeposit.usd"]).toBe("number");
    expect(attributes["limits.maxDeposit.usd"]).toBeGreaterThan(0);

    expect(typeof attributes["limits.maxDepositInstant.token"]).toBe("number");
    expect(attributes["limits.maxDepositInstant.token"]).toBeGreaterThan(0);
    expect(typeof attributes["limits.maxDepositInstant.usd"]).toBe("number");
    expect(attributes["limits.maxDepositInstant.usd"]).toBeGreaterThan(0);

    expect(typeof attributes["limits.maxDepositShortDelay.token"]).toBe(
      "number"
    );
    expect(attributes["limits.maxDepositShortDelay.token"]).toBeGreaterThan(0);
    expect(typeof attributes["limits.maxDepositShortDelay.usd"]).toBe("number");
    expect(attributes["limits.maxDepositShortDelay.usd"]).toBeGreaterThan(0);
    process.env.REACT_APP_VERCEL_API_BASE_URL_OVERRIDE = original_env_variable;
  });
});
