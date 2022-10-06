import { getCode } from "../address";
const V_ETH = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const UMA_ADDRESS = "0x04Fa0d235C4abf4BcF4787aF4CF447DE572eF828";

describe("#getCode", () => {
  it("return 0x when address is not a Contract", () => {
    return expect(getCode(V_ETH, 1)).resolves.toBe("0x");
  });

  it("returns a value different than 0x when address is a Contract", () => {
    return expect(getCode(UMA_ADDRESS, 1)).resolves.not.toBe("0x");
  });
});
