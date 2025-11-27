import { utils } from "ethers";
import { SwapApprovalQuote } from "utils/serverless-api/prod/swap-approval";
import { getPriceImpact, formatFeeUsd } from "./fees";

describe("getPriceImpact", () => {
  it("should return default values if no fees in quote", () => {
    const result = getPriceImpact(undefined);

    expect(result).toEqual({
      tooHigh: false,
      priceImpact: 0,
      priceImpactFormatted: "0",
    });
  });

  it("should return default values if quote has no fees", () => {
    const quote = {} as SwapApprovalQuote;
    const result = getPriceImpact(quote);

    expect(result).toEqual({
      tooHigh: false,
      priceImpact: 0,
      priceImpactFormatted: "0",
    });
  });

  it("should return correct data when fees are not too high", () => {
    // 5% fee (0.05 * 1e18)
    const quote = {
      fees: {
        total: {
          pct: utils.parseEther("0.05"),
        },
      },
    } as SwapApprovalQuote;

    const result = getPriceImpact(quote);

    expect(result.tooHigh).toBe(false);
    expect(result.priceImpact).toBe(0.05);
    expect(result.priceImpactFormatted).toBe("5.0");
  });

  it("should return correct data when fees are too high", () => {
    // 15% fee (0.15 * 1e18) - above the 10% threshold
    const quote = {
      fees: {
        total: {
          pct: utils.parseEther("0.15"),
        },
      },
    } as SwapApprovalQuote;

    const result = getPriceImpact(quote);

    expect(result.tooHigh).toBe(true);
    expect(result.priceImpact).toBe(0.15);
    expect(result.priceImpactFormatted).toBe("15.0");
  });

  it("should return correct data when fees are exactly 10%", () => {
    // Exactly 10% fee (0.10 * 1e18) - at the threshold
    const quote = {
      fees: {
        total: {
          pct: utils.parseEther("0.1"),
        },
      },
    } as SwapApprovalQuote;

    const result = getPriceImpact(quote);

    expect(result.tooHigh).toBe(true); // >= 10% should be true
    expect(result.priceImpact).toBe(0.1);
    expect(result.priceImpactFormatted).toBe("10.0");
  });

  it("should return default values if fees are negative", () => {
    // Negative fee (e.g., -0.05 * 1e18)
    const quote = {
      fees: {
        total: {
          pct: utils.parseEther("-0.05"),
        },
      },
    } as SwapApprovalQuote;

    const result = getPriceImpact(quote);

    expect(result).toEqual({
      tooHigh: false,
      priceImpact: 0,
      priceImpactFormatted: "0",
    });
  });
});

describe("formatFeeUsd", () => {
  it("should format fees >= $0.01 with standard 2 decimal formatting", () => {
    const result1 = formatFeeUsd("0.01");
    expect(result1).toBe("$0.01");

    const result2 = formatFeeUsd("1.50");
    expect(result2).toBe("$1.50");
  });

  it("should round DOWN fees >= $0.001 and < $0.01 to 3 decimal places", () => {
    const result1 = formatFeeUsd("0.00567");
    expect(result1).toBe("$0.005");

    const result2 = formatFeeUsd("0.00999");
    expect(result2).toBe("$0.009");
  });

  it("should round UP fees < $0.001 to $0.001", () => {
    const result1 = formatFeeUsd("0.0005");
    expect(result1).toBe("$0.001");

    const result2 = formatFeeUsd("0.0001");
    expect(result2).toBe("$0.001");

    const result3 = formatFeeUsd("0.0009");
    expect(result3).toBe("$0.001");
  });
});
