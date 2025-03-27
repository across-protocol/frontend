import { BigNumber, BigNumberish } from "ethers";

export function bigNumberifyObject<T>(obj: Record<string, unknown>): T {
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).map(([key, value]) => {
      if (isBigNumberish(value)) {
        return [key, BigNumber.from(value)];
      }

      if (typeof value === "object" && value !== null) {
        return [key, bigNumberifyObject(value as Record<string, unknown>)];
      }

      return [key, value];
    })
  ) as T;
}

export function isBigNumberish(value: unknown): value is BigNumberish {
  try {
    BigNumber.from(value);
    return true;
  } catch (e) {
    return false;
  }
}
