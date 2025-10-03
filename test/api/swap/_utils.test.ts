import { BigNumber } from "ethers";
import { stringifyBigNumProps } from "../../../api/swap/_utils";

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
