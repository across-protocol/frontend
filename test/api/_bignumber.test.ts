import { BigNumber } from "ethers";
import { divCeil } from "../../api/_bignumber";

describe("api/_bignumber", () => {
  describe("divCeil", () => {
    describe("Basic behavior", () => {
      test("should round up when there is a remainder", () => {
        expect(divCeil(BigNumber.from(10), BigNumber.from(3)).toString()).toBe(
          "4"
        );
        expect(divCeil(BigNumber.from(7), BigNumber.from(2)).toString()).toBe(
          "4"
        );
      });

      test("should return exact result when no remainder", () => {
        expect(divCeil(BigNumber.from(9), BigNumber.from(3)).toString()).toBe(
          "3"
        );
        expect(divCeil(BigNumber.from(10), BigNumber.from(5)).toString()).toBe(
          "2"
        );
      });

      test("should return 0 for zero dividend", () => {
        expect(divCeil(BigNumber.from(0), BigNumber.from(5)).toString()).toBe(
          "0"
        );
      });

      test("should return 1 when dividend is smaller than divisor", () => {
        expect(divCeil(BigNumber.from(1), BigNumber.from(10)).toString()).toBe(
          "1"
        );
      });

      test("should throw error for division by zero", () => {
        expect(() => divCeil(BigNumber.from(10), BigNumber.from(0))).toThrow(
          "Division by zero"
        );
      });

      test("should throw for negative numbers", () => {
        expect(() => divCeil(BigNumber.from(-10), BigNumber.from(3))).toThrow(
          "divCeil only supports positive BigNumbers"
        );

        expect(() => divCeil(BigNumber.from(10), BigNumber.from(-3))).toThrow(
          "divCeil only supports positive BigNumbers"
        );
      });
    });

    describe("CCTP fee calculation scenarios", () => {
      test("should round up 1 bps fee on 999,999,999", () => {
        // 999,999,999 * 1 / 10000 = 99,999.9999 -> rounds up to 100,000
        const amount = BigNumber.from(999_999_999);
        const bps = BigNumber.from(1);
        const result = divCeil(amount.mul(bps), BigNumber.from(10_000));

        expect(result.toString()).toBe("100000");
      });

      test("should handle exact division for 1,000,000,000 * 1 bps", () => {
        // 1,000,000,000 * 1 / 10000 = 100,000 exactly
        const amount = BigNumber.from(1_000_000_000);
        const bps = BigNumber.from(1);
        const result = divCeil(amount.mul(bps), BigNumber.from(10_000));

        expect(result.toString()).toBe("100000");
      });

      test("should ensure minimum fee of 1 unit for tiny amounts", () => {
        // Even for 1 unit with 1 bps, should round up to 1
        const tinyAmount = BigNumber.from(1);
        const bps = BigNumber.from(1);
        const result = divCeil(tinyAmount.mul(bps), BigNumber.from(10_000));

        expect(result.toString()).toBe("1");
      });
    });

    describe("Comparison with regular division", () => {
      test("divCeil should round up while div rounds down", () => {
        const dividend = BigNumber.from(1001);
        const divisor = BigNumber.from(100);

        expect(dividend.div(divisor).toString()).toBe("10"); // Regular: floor
        expect(divCeil(dividend, divisor).toString()).toBe("11"); // Ceiling: ceil
      });

      test("divCeil and div should match when no remainder", () => {
        const dividend = BigNumber.from(1000);
        const divisor = BigNumber.from(100);

        expect(dividend.div(divisor).toString()).toBe("10");
        expect(divCeil(dividend, divisor).toString()).toBe("10");
      });
    });
  });
});
