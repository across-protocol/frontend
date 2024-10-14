import { define } from "superstruct";
import { BigNumber, utils } from "ethers";

export function parsableBigNumberString() {
  return define<string>("parsableBigNumberString", (value) => {
    try {
      BigNumber.from(value);
      return true;
    } catch (error) {
      return false;
    }
  });
}

export function validAddress() {
  return define<string>("validAddress", (value) =>
    utils.isAddress(value as string)
  );
}

export function validAddressOrENS() {
  return define<string>("validAddressOrENS", (value) => {
    const ensDomainRegex =
      // eslint-disable-next-line no-useless-escape
      /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/;
    return (
      utils.isAddress(value as string) || ensDomainRegex.test(value as string)
    );
  });
}

export function positiveIntStr() {
  return define<string>("positiveIntStr", (value) => {
    return Number.isInteger(Number(value)) && Number(value) > 0;
  });
}

export function positiveFloatStr(maxValue?: number) {
  return define<string>("positiveFloatStr", (value) => {
    return Number(value) >= 0 && (maxValue ? Number(value) <= maxValue : true);
  });
}

export function boolStr() {
  return define<string>("boolStr", (value) => {
    return value === "true" || value === "false";
  });
}
