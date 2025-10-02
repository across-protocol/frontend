import { BigNumber } from "ethers";
import { stringifyBigNumProps } from "../../../api/swap/_utils";
import { getLimitsSpanAttributes } from "../../../api/_utils";
import { Token } from "../../../api/_dexes/types";

describe("stringifyBigNumProps", () => {
  describe("BigNumber detection and conversion", () => {
    test("should convert standard BigNumber instances to strings", () => {
      const input = {
        amount: BigNumber.from(100),
        balance: BigNumber.from(200),
      };

      const result = stringifyBigNumProps(input);

      expect(result.amount).toBe("100");
      expect(result.balance).toBe("200");
    });

    test("should convert BigNumber objects with _isBigNumber property to strings", () => {
      // Simulate a BigNumber that lost its prototype or is from a different library (like in the allowance issue)
      const mockBigNumber = {
        _hex: "0x64", // 100 in hex
        _isBigNumber: true,
        toString: () => "100",
      };

      const input = {
        allowance: mockBigNumber,
        balance: BigNumber.from(200),
      };

      const result = stringifyBigNumProps(input);

      expect(result.allowance).toBe("100");
      expect(result.balance).toBe("200");
    });

    test("should handle mixed BigNumber types", () => {
      const standardBigNumber = BigNumber.from(100);
      const mockBigNumber = {
        _hex: "0xc8", // 200 in hex
        _isBigNumber: true,
        toString: () => "200",
      };

      const input = {
        standard: standardBigNumber,
        mock: mockBigNumber,
        regular: "string",
      };

      const result = stringifyBigNumProps(input);

      expect(result.standard).toBe("100");
      expect(result.mock).toBe("200");
      expect(result.regular).toBe("string");
    });
  });

  describe("nested object handling", () => {
    test("should handle nested objects with BigNumbers", () => {
      const input = {
        user: {
          balance: BigNumber.from(100),
          allowance: {
            actual: BigNumber.from(50),
            expected: BigNumber.from(100),
          },
        },
        token: "USDC",
      };

      const result = stringifyBigNumProps(input);

      expect(result.user.balance).toBe("100");
      expect(result.user.allowance.actual).toBe("50");
      expect(result.user.allowance.expected).toBe("100");
      expect(result.token).toBe("USDC");
    });

    test("should handle deeply nested BigNumbers", () => {
      const input = {
        level1: {
          level2: {
            level3: {
              amount: BigNumber.from(1000),
            },
          },
        },
      };

      const result = stringifyBigNumProps(input);

      expect(result.level1.level2.level3.amount).toBe("1000");
    });
  });

  describe("array handling", () => {
    test("should handle arrays with BigNumbers", () => {
      const input = {
        amounts: [
          BigNumber.from(100),
          BigNumber.from(200),
          BigNumber.from(300),
        ],
        names: ["Alice", "Bob", "Charlie"],
      };

      const result = stringifyBigNumProps(input);

      expect(result.amounts).toEqual(["100", "200", "300"]);
      expect(result.names).toEqual(["Alice", "Bob", "Charlie"]);
    });

    test("should handle nested arrays with BigNumbers", () => {
      const input = {
        transactions: [
          {
            amount: BigNumber.from(100),
            fee: BigNumber.from(5),
          },
          {
            amount: BigNumber.from(200),
            fee: BigNumber.from(10),
          },
        ],
      };

      const result = stringifyBigNumProps(input);

      expect(result.transactions[0].amount).toBe("100");
      expect(result.transactions[0].fee).toBe("5");
      expect(result.transactions[1].amount).toBe("200");
      expect(result.transactions[1].fee).toBe("10");
    });
  });

  describe("edge cases", () => {
    test("should handle null and undefined values", () => {
      const input = {
        amount: BigNumber.from(100),
        balance: null,
        allowance: undefined,
      };

      const result = stringifyBigNumProps(input);

      expect(result.amount).toBe("100");
      expect(result.balance).toBe(null);
      expect(result.allowance).toBe(undefined);
    });

    test("should handle empty objects and arrays", () => {
      const input = {
        emptyObj: {},
        emptyArr: [],
        amount: BigNumber.from(100),
      };

      const result = stringifyBigNumProps(input);

      expect(result.emptyObj).toEqual({});
      expect(result.emptyArr).toEqual([]);
      expect(result.amount).toBe("100");
    });

    test("should handle primitive values", () => {
      const input = {
        string: "hello",
        number: 42,
        boolean: true,
        amount: BigNumber.from(100),
      };

      const result = stringifyBigNumProps(input);

      expect(result.string).toBe("hello");
      expect(result.number).toBe(42);
      expect(result.boolean).toBe(true);
      expect(result.amount).toBe("100");
    });
  });

  describe("real-world scenarios", () => {
    test("should handle swap quote structure", () => {
      const input = {
        crossSwapType: "bridgeableToAny",
        amountType: "exactOutput",
        checks: {
          allowance: {
            token: "0x0000000000000000000000000000000000000000",
            spender: "0x89415a82d909a7238d69094C3Dd1dCC1aCbDa85C",
            actual: {
              _hex: "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
              _isBigNumber: true,
              toString: () =>
                "115792089237316195423570985008687907853269984665640564039457584007913129639935",
            },
            expected: BigNumber.from(689821235147287),
          },
          balance: {
            token: "0x0000000000000000000000000000000000000000",
            actual: {
              _hex: "0x971f25b1e0245c",
              _isBigNumber: true,
              toString: () => "689821235147287",
            },
            expected: BigNumber.from(689821235147287),
          },
        },
      };

      const result = stringifyBigNumProps(input);

      // Verify all BigNumber values are converted to strings
      expect(typeof result.checks.allowance.actual).toBe("string");
      expect(typeof result.checks.allowance.expected).toBe("string");
      expect(typeof result.checks.balance.actual).toBe("string");
      expect(typeof result.checks.balance.expected).toBe("string");

      // Verify the values are correct
      expect(result.checks.allowance.actual).toBe(
        "115792089237316195423570985008687907853269984665640564039457584007913129639935"
      );
      expect(result.checks.allowance.expected).toBe("689821235147287");
      expect(result.checks.balance.actual).toBe("689821235147287");
      expect(result.checks.balance.expected).toBe("689821235147287");
    });
  });
});

describe("getLimitsSpanAttributes", () => {
  it("should return the correct attributes with mocked prices", async () => {
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

  it("should return valid attributes with real prices", async () => {
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
  });
});
