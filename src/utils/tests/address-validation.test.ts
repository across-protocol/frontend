import { isValidAddress, getAddress } from "../address-validation";

const UMA_TOKEN_ADDRESS = "0x04Fa0d235C4abf4BcF4787aF4CF447DE572eF828";
describe("#isValidAddress", () => {
  it("returns true for a valid address", () => {
    expect(isValidAddress(UMA_TOKEN_ADDRESS)).toBeTruthy();
  });

  it("returns false for an invalid address", () => {
    expect(isValidAddress("0x12345")).toBeFalsy();
  });
});
