import { utils } from "ethers";

import {
  isValidString,
  shortenAddress,
  shortenString,
  shortenTransactionHash,
  smallNumberFormatter,
  formatUSD,
  parseUnits,
} from "../format";
const VALID_ADDRESS = "0x04Fa0d235C4abf4BcF4787aF4CF447DE572eF828";
const TX_HASH =
  "0xe5a0c976ca4d09ce6ea034101e78b1a6a9536940cb8f246e7b54d1fe16b8c125";

describe("#isValidString", () => {
  it("isValidString returns true when string is passed in", () => {
    expect(isValidString("xasdfas")).toBeTruthy();
  });

  it("isValidString returns false when null and undefi ed are passed in", () => {
    expect(isValidString(null)).toBeFalsy();
    expect(isValidString(undefined)).toBeFalsy();
  });
});

describe("#shortenAddress", () => {
  // TODO: shortenAddress should probably be refactored to check for
  // address validity. Will adjust when deal with jest import issues.
  it("shortenAddress should return empty string when empty string is passed in", () => {
    expect(shortenAddress("", "....", 4)).toEqual("");
  });

  it("shortenAddress should shorten string when a valid address is passed in", () => {
    expect(shortenAddress(VALID_ADDRESS, "....", 4)).toEqual("0x04....F828");
    expect(shortenAddress(VALID_ADDRESS, "...", 3)).toEqual("0x0...828");
  });
});

describe("#shortenString", () => {
  it("shortenString should return original string if string length is less than 2 * numChars.", () => {
    expect(shortenString("x", "---", 2)).toEqual("x");
    expect(shortenString("yyyy", "---", 3)).toEqual("yyyy");
  });

  it("shortenString should return a shortened string if str.length is greater than 2 * numChars", () => {
    expect(shortenString("xxxxyyyy", "--", 2)).toEqual("xx--yy");
  });
});

describe("#shortenTransactionHash", () => {
  it("shortenTransactionHash should shorten to first 5 chars + ...", () => {
    expect(shortenTransactionHash(TX_HASH)).toEqual("0xe5a...");
  });
});

describe("#smallNumberFormatter", () => {
  it("smallNumberFormatter should show at least 1 digit for numbers < 1 and round up to 3 sig digs", () => {
    expect(smallNumberFormatter(0.01235)).toEqual("0.0124");
  });
});

describe("#formatUSD", () => {
  it("should format a wei BigNumber to 2 decimal places", () => {
    expect(formatUSD(utils.parseEther("1.1"))).toEqual("1.10");
  });

  it("should format a very small wei number to 2 decimal places", () => {
    expect(formatUSD(1)).toEqual("0.00");
  });

  it("should format a large wei BigNumber to 2 decimal places", () => {
    expect(formatUSD(utils.parseEther("100000.123456"))).toEqual("100,000.12");
  });
});

describe("#parseUnits", () => {
  it("should parse normal decimal strings", () => {
    expect(parseUnits("1.5", 18).toString()).toEqual(
      utils.parseUnits("1.5", 18).toString()
    );
  });

  it("should handle scientific notation with positive exponent", () => {
    expect(parseUnits("1e18", 18).toString()).toEqual(
      utils.parseUnits("1000000000000000000", 18).toString()
    );
  });

  it("should handle scientific notation with negative exponent", () => {
    const result = parseUnits("1.5e-7", 18);
    expect(result.gt(0)).toBe(true);
    expect(result.toString()).toEqual(
      utils.parseUnits("0.00000015", 18).toString()
    );
  });

  it("should handle very small numbers in scientific notation", () => {
    const result = parseUnits("2.5e-10", 18);
    expect(result.gt(0)).toBe(true);
  });

  it("should truncate excess decimal places", () => {
    const result = parseUnits("0.123456789012345678901234", 18);
    expect(result.toString()).toEqual(
      utils.parseUnits("0.123456789012345678", 18).toString()
    );
  });
});
