import { isValidString, shortenAddress } from "../format";

describe("#format functions", () => {
  it("isValidString returns true when string is passed in", () => {
    expect(isValidString("xasdfas")).toBeTruthy();
  });

  it("isValidString returns false when null and undefi ed are passed in", () => {
    expect(isValidString(null)).toBeFalsy();
    expect(isValidString(undefined)).toBeFalsy();
  });

  it("shortAddress should return empty string when empty string is passed in", () => {
    expect(shortenAddress("", "....", 4)).toEqual("");
  });
});
