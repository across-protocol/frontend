import { ethers } from "ethers";
import assert from "assert";

export function isValidString(s: string | null | undefined | ""): s is string {
  if (s != null && typeof s === "string" && s !== "") {
    return true;
  }
  return false;
}

/**
 *
 * @param address valid web3 address
 * @param delimiter string to put between your split string, eg: "...", "---"
 * @param numChars number of characters to keep on each part of the string
 * @returns string. Formatted version of address param.
 */

export function shortenAddress(
  address: string,
  delimiter: string,
  numChars: number
): string {
  if (!isValidString(address)) {
    return "";
  }
  return shortenString(address, delimiter, numChars);
}

/**
 *
 * @param str string to shorten
 * @param delimiter string to put between your split string, eg: "...", "---"
 * @param numChars number of characters to keep on each part of the string
 * @returns string. Formatted version of str param.
 */
export function shortenString(
  str: string,
  delimiter: string,
  numChars: number
): string {
  // Cannot shorten this string, force early return.
  if (str.length < 2 * numChars) return str;
  return `${str.substring(0, numChars)}${delimiter}${str.substring(
    str.length - numChars,
    str.length
  )}`;
}

export function shortenTransactionHash(hash: string): string {
  return `${hash.substring(0, 5)}...`;
}

// for number less than 1, this will ensure at least 1 digit is shown ( not rounded to 0)
export const smallNumberFormatter = (num: number) =>
  new Intl.NumberFormat("en-US", {
    minimumSignificantDigits: 1,
    maximumSignificantDigits: 3,
  }).format(num);

// for numbers 1 or greater, this will ensure we never round down and lose values > 1, while minimizing decimals to max of 3
export const largeNumberFormatter = (num: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 3,
  }).format(num);

// for numbers 1000 or greater, this will remove any fractional component to make it a bit cleaner
export const veryLargeNumberFormatter = (num: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(num);

export function formatUnits(
  wei: ethers.BigNumberish,
  decimals: number
): string {
  const value = Number(ethers.utils.formatUnits(wei, decimals));
  if (value >= 1000) {
    return veryLargeNumberFormatter(value);
  }
  if (value >= 1) {
    return largeNumberFormatter(value);
  }
  return smallNumberFormatter(value);
}

export function formatEther(wei: ethers.BigNumberish): string {
  return formatUnits(wei, 18);
}

export function formatEtherRaw(wei: ethers.BigNumberish): string {
  return ethers.utils.formatUnits(wei, 18);
}

export function parseUnits(value: string, decimals: number): ethers.BigNumber {
  return ethers.utils.parseUnits(value, decimals);
}

export function parseEther(value: string): ethers.BigNumber {
  return parseUnits(value, 18);
}

export function stringToHex(value: string) {
  return ethers.utils.hexlify(ethers.utils.toUtf8Bytes(value));
}

// appends hex tag to data
export function tagHex(
  dataHex: string,
  tagHex: string,
  delimitterHex: string = ""
) {
  assert(ethers.utils.isHexString(dataHex), "Data must be valid hex string");
  return ethers.utils.hexConcat([dataHex, delimitterHex, tagHex]);
}

// converts a string tag to hex and appends, currently not in use
export function tagString(dataHex: string, tagString: string) {
  return tagHex(dataHex, stringToHex(tagString));
}

// tags only an address
export function tagAddress(
  dataHex: string,
  address: string,
  delimiterHex: string = ""
) {
  assert(ethers.utils.isAddress(address), "Data must be a valid address");
  return tagHex(dataHex, address, delimiterHex);
}

export function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const twoSigFormatter = new Intl.NumberFormat("en-US", {
  maximumSignificantDigits: 2,
});

export const formatNumberTwoSigDigits =
  twoSigFormatter.format.bind(twoSigFormatter);

const threeMaxFracFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 3,
});

export const formatNumberMaxFracDigits = threeMaxFracFormatter.format.bind(
  threeMaxFracFormatter
);

export function formatPoolAPY(
  wei: ethers.BigNumberish,
  decimals: number
): string {
  return formatNumberMaxFracDigits(
    Number(ethers.utils.formatUnits(wei, decimals))
  );
}

/**
 * An encapsulated ternary operator for choosing one or two strings based on a logic expression
 * @param text The text that will appear if useText is set to true
 * @param useText Determines if text or backupText will be returned
 * @param backupText The text that will appear if useText is false
 * @returns text if useText is true, else, backupText
 */
export function valueOrFill(
  text: string,
  useText: boolean,
  backupText: string = "-"
): string {
  return useText ? text : backupText;
}
