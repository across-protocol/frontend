import { toWeiSafe } from "../weiMath";

describe("toWeiSafe", () => {
  it("Converts the value without an error", () => {
    const toBigNum = toWeiSafe("1").toString();
    expect(toBigNum).toEqual("1000000000000000000");
  });
});
