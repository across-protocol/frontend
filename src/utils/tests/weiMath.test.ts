import { toWeiSafe } from "../weiMath";
import { getCode } from "../address";
const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("toWeiSafe", () => {
  it("Converts the value without an error", () => {
    const toBigNum = toWeiSafe("1").toString();
    expect(toBigNum).toEqual("1000000000000000000");
  });
});

describe("#getCode", () => {
  it("return 0x when address is not a Contract", () => {
    expect(getCode("0x0000000000000000000000000000000000000000", 1)).toEqual(
      "0x"
    );
  });
});
