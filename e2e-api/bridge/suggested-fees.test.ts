import { getLimitsSpanAttributes } from "../../api/_utils";
import { Token } from "../../api/_dexes/types";

describe("GET /suggested-fees", () => {
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
