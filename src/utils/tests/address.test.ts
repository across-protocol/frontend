import { getCode } from "../address";

const V_ETH = process.env.REACT_APP_V_ETH || "";
const UMA_ADDRESS = process.env.REACT_APP_UMA_ADDRESS || "";

describe("#getCode", () => {
  it("return 0x when address is not a Contract", () => {
    return expect(getCode(V_ETH, 1)).resolves.toBe("0x");
  });

  it("returns a value different than 0x when address is a Contract", () => {
    return expect(getCode(UMA_ADDRESS, 1)).resolves.not.toBe("0x");
  });
});
